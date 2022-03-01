import { Playlist } from '@Shared/Types';
import { ValueNode } from '../BoolFilter';

export class PlaylistValueNode extends ValueNode<Playlist> {
  public DefaultComparator(input: Playlist, filter: string): boolean {
    return input.title
      .toLowerCase()
      .includes(filter.toLowerCase());
  }

  // TODO: Implement me
  public PropComparator(input: Playlist, prop: string, filter: string): boolean {
    return false;
  }
}
