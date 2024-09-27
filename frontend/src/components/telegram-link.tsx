import Image from "next/image";
import telegram from "@/static/images/telegram.svg";

export function TelegramLink({username}: { username?: string }) {
    return username ? <a onClick={e => e.stopPropagation()}
              href={`https://t.me/${username}`} target={"_blank"}>
        <Image alt={"telegram"} src={telegram} width={24} height={24}/>
    </a> : <Image className={"grayscale"} alt={"telegram"} src={telegram} width={24} height={24}/>;
}