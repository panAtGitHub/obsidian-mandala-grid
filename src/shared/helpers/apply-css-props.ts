export const applyCssProps = (
    element: HTMLElement,
    props: Readonly<Record<string, string>>,
) => {
    for (const [name, value] of Object.entries(props)) {
        if (value === '') {
            element.style.removeProperty(name);
            continue;
        }
        element.style.setProperty(name, value);
    }
};
