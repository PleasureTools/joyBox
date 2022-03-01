import {
  Action,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';

import store from './index';

export interface SettingsBackup {
  filename: string;
  begin: number;
  end: number;
}

@Module({ namespaced: true, name: 'ClipSettings', dynamic: true, store })
export default class ClipSettings extends VuexModule {
  public settings: SettingsBackup | null = null;

  @Action
  public HasSettings(filename: string): boolean {
    return filename === this.settings?.filename;
  }

  @Mutation
  public Reset(): void {
    this.settings = null;
  }

  @Mutation
  public Backup(settings: SettingsBackup): void {
    this.settings = settings;
  }

  public get Settings(): SettingsBackup {
    return this.settings as SettingsBackup;
  }
}
