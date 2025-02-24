const mdWithHtmlElement = `<span data-section="1"/>

# heading 1
# heading 2

- <span data-section="2"/>1
- 2
- 3

<span data-section="3"/>text

<span data-section="4"/>
\`\`\`css
svg{
display: none;
}
\`\`\`

<span data-section="5"/>
> quote

<span data-section="6"/>

| a   | b   |
| --- | --- |
| 1   | 2   |

<span data-section="7"/>
> [!info]
> information

<span data-section="8"/><!--comment -->`;

const mdWithHtmlComment = `
<!--section: 1-->
# heading 1
# heading 2

<!--section: 2-->
- 1
- 2
- 3

<!--section: 3-->
text

<!--section: 4-->
\`\`\`css
svg{
display: none;
}
\`\`\`

<!--section: 5-->
> quote

<!--section: 6-->
| a   | b   |
| --- | --- |
| 1   | 2   |

<!--section: 7-->
> [!info]
> information

<!--section: 8-->
<!--comment -->`;

export const html_element_conflicting_elements = {
    mdWithHtmlComment,
    mdWithHtmlElement,
};
