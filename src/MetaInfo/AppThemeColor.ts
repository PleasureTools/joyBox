
import { Framework } from 'vuetify';

export default ($vuetify: Framework) =>
    ({ name: 'theme-color', content: ($vuetify.theme as any).currentTheme.primary as string });
