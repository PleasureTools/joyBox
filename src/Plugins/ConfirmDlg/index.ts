import _Vue from 'vue';
import Vuetify from 'vuetify';

import Dlg from './View.vue';

interface ConfirmDlgOptions {
  vuetify: typeof Vuetify;
  el(): HTMLElement;
}
export class ConfirmDlgApi {
  public constructor(private options: ConfirmDlgOptions) { }
  public Show(message: string): Promise<boolean> {
    return new Promise<boolean>(ok => {
      const component: Dlg = new Dlg({
        propsData: { message },
        vuetify: this.options.vuetify,
        destroyed: () => this.Done(component, ok)
      });

      this.options.el().appendChild(component.$mount().$el);
    });
  }

  private Done(cmp: Dlg, cb: (x: boolean) => void) {
    this.options.el().removeChild(cmp.$el);
    cb(((cmp as unknown) as { value: boolean } & Dlg).value);
  }
}
export function ConfirmDlgPlugin(Vue: typeof _Vue, options: ConfirmDlgOptions): void {
  Vue.prototype.$confirm = new ConfirmDlgApi(options);
}
