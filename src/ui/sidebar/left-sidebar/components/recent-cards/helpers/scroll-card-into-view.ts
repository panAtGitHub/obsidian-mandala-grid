export const scrollCardIntoView = (
    container: HTMLElement,
    activeNodeId: string,
) => {
    const activeCard = container.querySelector(
        `#${activeNodeId}`,
    );
    if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
};
