import {GitHubLogoIcon} from "@radix-ui/react-icons";

export function GitHubLink({username}: { username: string }) {
    return <a onClick={e => e.stopPropagation()} href={`https://github.com/${username}`}
              target={"_blank"}>
        <GitHubLogoIcon width={24} height={24} className={"min-w-[24px]"}/>
    </a>;
}