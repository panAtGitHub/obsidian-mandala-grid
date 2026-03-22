export const getElementById = (container: HTMLElement, id: string) => {
    if (id) return container.querySelector('#' + id) as HTMLElement | undefined;
};
