enum OperatorTokenType { OR = '|', XOR = '^', AND = '&', NOT = '!' }
enum BracketsTokenType { LEFT_BRACKET = '(', RIGHT_BRACKET = ')' }
enum ValueTokenType { VALUE }
type TokenType = OperatorTokenType | BracketsTokenType | ValueTokenType;
interface Token {
    value: string;
    type: TokenType;
    begin: number;
}
enum OperatorType { UNARY = 1, BINARY = 2 }
interface Operator {
    precedence: number;
    type: OperatorTokenType;
    operands: OperatorType;
}
class OperatorRegistry {
    private readonly ops: Operator[] = [
        { precedence: 1, type: OperatorTokenType.OR, operands: OperatorType.BINARY },
        { precedence: 2, type: OperatorTokenType.AND, operands: OperatorType.BINARY },
        { precedence: 3, type: OperatorTokenType.XOR, operands: OperatorType.BINARY },
        { precedence: 5, type: OperatorTokenType.NOT, operands: OperatorType.UNARY }];

    public Find(str: string) {
        return this.ops.find(x => x.type === str) || null;
    }
    public Less(a: Operator, b: Operator) {
        return a.precedence < b.precedence;
    }
}
type Bracket = BracketsTokenType;
class BracketRegistry {
    private readonly brackets: Bracket[] = [BracketsTokenType.LEFT_BRACKET, BracketsTokenType.RIGHT_BRACKET];
    public Find(str: string) {
        return this.brackets.find(x => x === str) || null;
    }
}
class ValueMode {
    public readonly NON_VALUE_MODE = -1;
    public N: number = this.NON_VALUE_MODE;

    public Reset() {
        this.N = this.NON_VALUE_MODE;
    }

    public get Active() {
        return this.N !== this.NON_VALUE_MODE;
    }
}
class Tokenizer {
    private operators = new OperatorRegistry();
    private brackets = new BracketRegistry();
    private vs = new ValueMode();

    public Parse(expr: string): Token[] {
        const tokens: Token[] = [];
        this.vs.Reset();
        for (let i = 0; i < expr.length; ++i) {

            if (expr[i] === ' ')
                continue;

            const op = this.operators.Find(expr[i]);
            if (op) {
                if (this.vs.Active) {
                    tokens.push({
                        value: expr.substring(this.vs.N, i).trim(),
                        type: ValueTokenType.VALUE,
                        begin: this.vs.N
                    });
                    this.vs.Reset();
                }
                tokens.push({ value: op.type, type: op.type, begin: i });
                continue;
            }
            const bracket = this.brackets.Find(expr[i]);
            if (bracket) {
                if (this.vs.Active) {
                    tokens.push({
                        value: expr.substring(this.vs.N, i).trim(),
                        type: ValueTokenType.VALUE,
                        begin: this.vs.N
                    });
                    this.vs.Reset();
                }
                tokens.push({ value: expr[i], type: bracket, begin: i });
                continue;
            }

            if (!this.vs.Active)
                this.vs.N = i;
        }

        if (this.vs.Active)
            tokens.push({
                value: expr.substring(this.vs.N, expr.length).trim(),
                type: ValueTokenType.VALUE,
                begin: this.vs.N
            });

        return tokens;
    }
}
interface ASTNode<T> {
    Execute(input: T): boolean;
}
export abstract class ValueNode<T> implements ASTNode<T> {
    private filter: string;
    public constructor(filter: string) {
        this.filter = filter;
    }
    public Execute(input: T): boolean {
        const propFilter = this.TryDisassemble();

        return propFilter ?
            this.PropComparator(input, propFilter.prop, propFilter.value) :
            this.DefaultComparator(input, this.filter);
    }
    public abstract DefaultComparator(input: T, filter: string): boolean;
    public abstract PropComparator(input: T, prop: string, filter: string): boolean;
    // Filter can be 'value' or 'prop:value'
    private TryDisassemble(): { prop: string, value: string } | null {
        const disassembled = this.filter.split(':');
        return disassembled.length === 2 ? { prop: disassembled[0], value: disassembled[1] } : null;
    }
}
abstract class UnaryNode<T> implements ASTNode<T> {
    public constructor(public Next: ASTNode<T> | null = null) { }
    public Execute(input: T): boolean {
        return this.Impl(this.Next!.Execute(input));
    }
    public abstract Impl(next: boolean): boolean;
}

class NotOperatorNode<T> extends UnaryNode<T> {
    public Impl(next: boolean): boolean {
        return !next;
    }
}
abstract class BinaryNode<T> implements ASTNode<T> {
    public constructor(public Left: ASTNode<T> | null = null, public Right: ASTNode<T> | null = null) { }
    public Execute(input: T): boolean {
        return this.Impl(this.Left!.Execute(input), this.Right!.Execute(input));
    }
    public abstract Impl(left: boolean, right: boolean): boolean;
}
class OrOperatorNode<T> extends BinaryNode<T> {
    public Impl(left: boolean, right: boolean): boolean {
        return left || right;
    }
}
class XorOperatorNode<T> extends BinaryNode<T> {
    public Impl(left: boolean, right: boolean): boolean {
        return left !== right;
    }
}
class AndOperatorNode<T> extends BinaryNode<T> {
    public Impl(left: boolean, right: boolean): boolean {
        return left && right;
    }
}
class AST<T, VC extends ValueNode<T>> {
    private tokens!: Token[];
    private valueStack: string[] = [];
    private constructed: Array<ASTNode<T>> = [];
    private operatorStack: Operator[] = [];
    private root: ASTNode<T> | null = null;
    private ops = new OperatorRegistry();
    private curOp: Operator | null = null;
    public constructor(private ValueConstructor: new (filter: string) => VC) { }
    public Build(tokens: Token[]) {
        this.tokens = tokens;
        this.PreOptimize();
        for (let idx = 0, t = this.tokens[idx];
            idx < this.tokens.length;
            t = this.tokens[++idx]) {

            if (t.type === ValueTokenType.VALUE) {
                this.valueStack.push(t.value);
            } else if (this.TryExtractOperator(t)) {
                if (this.operatorStack.length) {
                    if (this.curOp!.precedence > (this.OpTop as Operator).precedence) {
                        this.operatorStack.push(this.curOp!);
                    } else {
                        this.BuildFragment();
                        this.operatorStack.push(this.curOp!);
                    }
                } else {
                    this.operatorStack.push(this.curOp!);
                }
            } else if (t.type === BracketsTokenType.LEFT_BRACKET) {
                let p = 1;
                let i = idx + 1;
                for (; p !== 0 && i < this.tokens.length; ++i) {
                    switch (this.tokens[i].type) {
                        case BracketsTokenType.LEFT_BRACKET:
                            ++p;
                            break;
                        case BracketsTokenType.RIGHT_BRACKET:
                            --p;
                            break;
                    }
                }

                const ast = new AST(this.ValueConstructor);
                const tree = ast.Build(this.tokens.slice(idx + 1, i - 1));
                if (tree) {
                    this.constructed.push(tree);
                    this.valueStack.push(''); // empty means take value from this.constructed
                }

                idx = i - 1;
            }
        }
        this.BuildFragment();

        if (!this.root) {
            if (this.constructed.length) {
                this.root = this.constructed.pop()!;
            } else if (this.valueStack.length) {
                this.root = new this.ValueConstructor(this.valueStack.pop()!);
            }
        }
        if (!this.root && this.constructed.length) {
            this.root = this.constructed.pop()!;
        }
        return this.root;
    }
    private PreOptimize() {
        this.RemoveRedundantNot();
    }
    private RemoveRedundantNot() {
        let discardNext = false;
        this.tokens = this.tokens
            .filter((x, i) => !(discardNext && !(discardNext = false)
                || (discardNext = x.type === OperatorTokenType.NOT && this.tokens[i + 1].type === x.type)));
    }
    private get OpTop() {
        return this.operatorStack[this.operatorStack.length - 1];
    }
    private TryExtractOperator(t: Token): boolean {
        this.curOp = this.ops.Find(t.type as string);
        return !!this.curOp;
    }
    private BuildFragment() {
        let subtree: ASTNode<T> | null = null;
        while (this.operatorStack.length) {
            const lop = this.operatorStack.pop()!;
            if (subtree) {
                if (lop!.operands === OperatorType.UNARY) {
                    const node = this.UnaryNode(lop!);
                    node.Next = subtree;
                    subtree = node;
                } else if (lop!.operands === OperatorType.BINARY) {
                    const node = this.BinaryNode(lop!);
                    const val = this.valueStack.pop()!;
                    node.Left = val === '' ? this.constructed.pop()! : new this.ValueConstructor(val);
                    node.Right = subtree;
                    subtree = node;
                }
            } else {
                if (lop!.operands === OperatorType.UNARY) {
                    const node = this.UnaryNode(lop!);
                    const val = this.valueStack.pop()!;
                    node.Next = val === '' ? this.constructed.pop()! : new this.ValueConstructor(val);
                    subtree = node;
                } else if (lop!.operands === OperatorType.BINARY) {
                    const node = this.BinaryNode(lop!);
                    const right = this.valueStack.pop()!;
                    const left = this.valueStack.pop()!;
                    node.Right = right === '' ? this.constructed.pop()! : new this.ValueConstructor(right);
                    node.Left = left === '' ? this.constructed.pop()! : new this.ValueConstructor(left);
                    subtree = node;
                }
            }
        }

        if (!subtree)
            return;

        if (this.root) {
            if (subtree instanceof UnaryNode)
                (subtree as UnaryNode<T>).Next = this.root;
            else
                (subtree as BinaryNode<T>).Left = this.root;
            this.root = subtree;
        } else {
            this.root = subtree;
        }
    }
    private UnaryNode(op: Operator): UnaryNode<T> {
        return new NotOperatorNode();
    }
    private BinaryNode(op: Operator): BinaryNode<T> {
        switch (op.type) {
            case OperatorTokenType.AND:
                return new AndOperatorNode();
            case OperatorTokenType.OR:
                return new OrOperatorNode();
            case OperatorTokenType.XOR:
                return new XorOperatorNode();
        }
        throw new Error('Argument is not binary operator.');
    }
}
export class ValidationError extends Error {
    private expr: string = '';
    public constructor(message: string, private subject: Token) { super(message); }
    public set Expression(expr: string) {
        this.expr = expr;
    }
    public Format() {
        const before = this.expr.substring(0, this.subject.begin);
        const subjectEnd = this.subject.begin + this.subject.value.length;
        const problem = this.expr.substring(this.subject.begin, subjectEnd);
        const after = this.expr.substring(subjectEnd, this.expr.length);
        return `${this.message}: ${before}<${problem}>${after}`;
    }
}
class Validator {
    private readonly BEGIN = 'begin';
    private readonly VALUE = 'value';
    private readonly UNOP = 'unop';
    private readonly BINOP = 'binop';
    private readonly LP = 'lp';
    private readonly RP = 'rp';
    private predictTable = new Map<string, string[]>();
    private prevType = this.BEGIN;
    private error: ValidationError | null = null;
    public constructor() {
        this.predictTable.set(this.BEGIN, [this.VALUE, this.LP, this.UNOP]);
        this.predictTable.set(this.VALUE, [this.BINOP, this.RP]);
        this.predictTable.set(this.BINOP, [this.VALUE, this.UNOP, this.LP]);
        this.predictTable.set(this.UNOP, [this.VALUE, this.UNOP, this.LP]);
        this.predictTable.set(this.LP, [this.UNOP, this.VALUE, this.LP]);
        this.predictTable.set(this.RP, [this.BINOP, this.RP]);
    }
    public Validate(tokens: Token[]) {
        if (!tokens.length)
            return false;

        const ret = tokens.every((t, i) => this.IsPermissible(t, i));
        if (!(this.error || this.ValidateLast)) {
            const subejct = tokens[tokens.length - 1];
            this.error = new ValidationError('Unexpected token', subejct);
        }
        return ret && this.ValidateLast;
    }
    private Typeid(token: Token) {
        if (token.type === ValueTokenType.VALUE)
            return this.VALUE;
        else if (token.type === BracketsTokenType.LEFT_BRACKET)
            return this.LP;
        else if (token.type === BracketsTokenType.RIGHT_BRACKET)
            return this.RP;
        else if (token.type === OperatorTokenType.NOT)
            return this.UNOP;
        else if (this.IsBinOp(token.type))
            return this.BINOP;
        throw new Error('Typeid error. Unknown token type.');
    }
    private IsBinOp(type: OperatorTokenType) {
        return [OperatorTokenType.AND, OperatorTokenType.OR, OperatorTokenType.XOR].includes(type);
    }
    private IsPermissible(token: Token, idx: number) {
        const expect = this.predictTable.get(this.prevType)!;
        const next = expect.find(x => x === this.Typeid(token));
        if (!next) {
            this.error = new ValidationError('Unexpected token', token);
            return false;
        }
        this.prevType = next;
        return true;
    }
    public get LastError() {
        return this.error;
    }
    private get ValidateLast() {
        return [this.VALUE, this.RP].includes(this.prevType);
    }
}
export class BoolFilter<T, VC extends ValueNode<T>> {
    private tokenizer = new Tokenizer();
    private validator = new Validator();
    private constr: AST<T, VC>;
    private tokens: Token[];
    private ast: ASTNode<T> | null = null;
    public constructor(private ValueConstructor: new (filter: string) => VC, query: string) {
        this.constr = new AST(this.ValueConstructor);
        this.tokens = this.tokenizer.Parse(query);
        if (!this.validator.Validate(this.tokens)) {
            this.validator.LastError!.Expression = query;
            throw this.validator.LastError;
        }
        this.ast = this.constr.Build(this.tokens);
    }
    public get Tokens() {
        return this.tokens;
    }
    public Test(input: T) {
        return this.ast ? this.ast.Execute(input) : false;
    }
}
