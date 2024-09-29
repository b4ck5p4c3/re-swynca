export function MemberInfoRow({title, children, collapseWhenSm}: {
    title: string,
    children: React.ReactNode,
    collapseWhenSm?: boolean
}) {
    return <div className={`flex ${collapseWhenSm ? "sm:flex-row flex-col" : "flex-row"}`}>
        <div className={"font-semibold"}>{title}:</div>
        <div className={"flex-1"}></div>
        <div>{children}</div>
    </div>;
}