import {
    Module,
    Mutation,
    VuexModule,
} from 'vuex-module-decorators';

interface NotificationArgs {
    message: string;
    type?: NotificationType;
}

export enum NotificationType {
    INFO, WARN, ERR
}

@Module({ namespaced: true, name: 'notification' })
export default class Notification extends VuexModule {
    public visible = false;
    public type = NotificationType.INFO;
    public message = '';

    @Mutation
    public SetVisible(val: boolean) {
        this.visible = val;
    }
    @Mutation
    public Show({ message, type = NotificationType.INFO }: NotificationArgs) {
        this.message = message;
        this.type = type;
        this.visible = true;
    }
}
