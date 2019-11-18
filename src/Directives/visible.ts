import { DirectiveOptions } from 'vue';

const visible: DirectiveOptions = {
    inserted(el, binding) {
        el.style.visibility = binding.value ? 'visible' : 'hidden';
    },
    update(el, binding) {
        el.style.visibility = binding.value ? 'visible' : 'hidden';
    }
};

export default visible;
