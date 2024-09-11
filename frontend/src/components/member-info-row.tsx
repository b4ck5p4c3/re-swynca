export function MemberInfoRow({title, children}: { title: string, children: React.ReactNode }) {
    return <div className={"flex flex-row"}>
        <div className={"font-semibold"}>{title}:</div>
        <div className={"flex-1"}></div>
        <div>{children}</div>
    </div>;
}