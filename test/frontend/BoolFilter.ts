import * as chai from 'chai';
import * as mocha from 'mocha';

import { BoolFilter, ValueNode } from './../../src/Common/BoolFilter';

class StringValueNode extends ValueNode<string> {
    public DefaultComparator(input: string, filter: string): boolean {
        return input.toLowerCase().includes(filter);
    }
    public PropComparator(input: string, prop: string, filter: string): boolean {
        return input.toLowerCase().includes(filter);
    }
}

describe('BoolFilter', () => {
    describe('Test', () => {
        describe('Simple inclusion: query=a', () => {
            const f = new BoolFilter(StringValueNode, 'a');
            it('a -> true', () => chai.expect(f.Test('a')).to.equal(true));
            it('abc -> true', () => chai.expect(f.Test('abc')).to.equal(true));
            it('fak -> true', () => chai.expect(f.Test('fak')).to.equal(true));
            it('Empty -> false', () => chai.expect(f.Test('')).to.equal(false));
            it('b -> false', () => chai.expect(f.Test('b')).to.equal(false));
            it('bcd -> false', () => chai.expect(f.Test('bcd')).to.equal(false));
        });
        describe('Case insensitivity: query=abc', () => {
            const f = new BoolFilter(StringValueNode, 'abc');
            it('ABC -> true', () => chai.expect(f.Test('ABC')).to.equal(true));
            it('Abc -> true', () => chai.expect(f.Test('Abc')).to.equal(true));
        });
        describe('Case insensitivity: query=ABC', () => {
            const f = new BoolFilter(StringValueNode, 'ABC');
            it('abc -> true', () => chai.expect(f.Test('abc')).to.equal(true));
            it('Abc -> true', () => chai.expect(f.Test('Abc')).to.equal(true));
        });
        describe('Simply binary OR: query=a|b', () => {
            const f = new BoolFilter(StringValueNode, 'a|b');
            it('a -> true', () => chai.expect(f.Test('a')).to.equal(true));
            it('b -> true', () => chai.expect(f.Test('b')).to.equal(true));
            it('ab -> true', () => chai.expect(f.Test('ab')).to.equal(true));
            it('c -> false', () => chai.expect(f.Test('c')).to.equal(false));
        });
        describe('Simply binary AND: query=a&b', () => {
            const f = new BoolFilter(StringValueNode, 'a&b');
            it('ab -> true', () => chai.expect(f.Test('ab')).to.equal(true));
            it('acb -> true', () => chai.expect(f.Test('acb')).to.equal(true));
            it('acd -> false', () => chai.expect(f.Test('acd')).to.equal(false));
            it('bcd -> false', () => chai.expect(f.Test('c')).to.equal(false));
        });
        describe('Simply binary XOR: query=a^b', () => {
            const f = new BoolFilter(StringValueNode, 'a^b');
            it('a -> true', () => chai.expect(f.Test('a')).to.equal(true));
            it('ac -> true', () => chai.expect(f.Test('ac')).to.equal(true));
            it('cb -> true', () => chai.expect(f.Test('cb')).to.equal(true));
            it('ab -> false', () => chai.expect(f.Test('ab')).to.equal(false));
        });
        describe('Simply unary NOT: query=!a', () => {
            const f = new BoolFilter(StringValueNode, '!a');
            it('Empty -> true', () => chai.expect(f.Test('')).to.equal(true));
            it('bc -> true', () => chai.expect(f.Test('bc')).to.equal(true));
            it('a -> false', () => chai.expect(f.Test('a')).to.equal(false));
            it('ab -> false', () => chai.expect(f.Test('ab')).to.equal(false));
        });
        describe('Operators precedence: query=a&b|c', () => {
            const f = new BoolFilter(StringValueNode, 'a&b|c');
            it('abc -> true', () => chai.expect(f.Test('abc')).to.equal(true));
            it('ab -> true', () => chai.expect(f.Test('ab')).to.equal(true));
            it('c -> true', () => chai.expect(f.Test('c')).to.equal(true));
            it('ad -> false', () => chai.expect(f.Test('ad')).to.equal(false));
            it('bd -> false', () => chai.expect(f.Test('bd')).to.equal(false));
            it('def -> false', () => chai.expect(f.Test('def')).to.equal(false));
        });
        describe('Operators precedence: query=a|b&c', () => {
            const f = new BoolFilter(StringValueNode, 'a|b&c');
            it('abc -> true', () => chai.expect(f.Test('abc')).to.equal(true));
            it('a -> true', () => chai.expect(f.Test('a')).to.equal(true));
            it('bc -> true', () => chai.expect(f.Test('bc')).to.equal(true));
            it('b -> false', () => chai.expect(f.Test('b')).to.equal(false));
        });
        describe('Operators precedence: query=a&b^c', () => {
            const f = new BoolFilter(StringValueNode, 'a&b^c');
            it('ab -> true', () => chai.expect(f.Test('ab')).to.equal(true));
            it('ac -> true', () => chai.expect(f.Test('ac')).to.equal(true));
            it('abc -> false', () => chai.expect(f.Test('abc')).to.equal(false));
            it('bc -> false', () => chai.expect(f.Test('bc')).to.equal(false));
        });
        describe('Double NOT: query=!!a', () => {
            const f = new BoolFilter(StringValueNode, '!!a');
            it('a -> true', () => chai.expect(f.Test('a')).to.equal(true));
            it('b -> false', () => chai.expect(f.Test('b')).to.equal(false));
        });
        describe('Double parentheses: query=((a))', () => {
            const f = new BoolFilter(StringValueNode, '((a))');
            it('a -> true', () => chai.expect(f.Test('a')).to.equal(true));
            it('b -> false', () => chai.expect(f.Test('b')).to.equal(false));
        });
        describe('Some case: query=!a&!b|(c|!d)&e', () => {
            const f = new BoolFilter(StringValueNode, '!a&!b|(c|!d)&e');
            it('c -> true', () => chai.expect(f.Test('c')).to.equal(true));
            it('cd -> true', () => chai.expect(f.Test('cd')).to.equal(true));
            it('ae -> true', () => chai.expect(f.Test('ae')).to.equal(true));
            it('g -> true', () => chai.expect(f.Test('g')).to.equal(true));
            it('abd -> false', () => chai.expect(f.Test('abd')).to.equal(false));
        });
        describe('Some case: query=a&(b^(c|e)&d)', () => {
            const f = new BoolFilter(StringValueNode, 'a&(b^(c|e)&d)');
            it('abd -> true', () => chai.expect(f.Test('abd')).to.equal(true));
            it('acd -> true', () => chai.expect(f.Test('acd')).to.equal(true));
            it('aed -> true', () => chai.expect(f.Test('aed')).to.equal(true));
            it('abc -> false', () => chai.expect(f.Test('abc')).to.equal(false));
            it('ad -> false', () => chai.expect(f.Test('ad')).to.equal(false));
        });
        describe('Invalid syntax: query=a||b', () => {
            it('ValidationError', () => chai.expect(() => new BoolFilter(StringValueNode, 'a||b'))
                .to.throw('Unexpected token'));
        });
    });
});
