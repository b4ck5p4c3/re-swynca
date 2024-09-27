import Image from "next/image";
import telegram from "@/static/images/telegram.svg";

export function TelegramLink({id}: { id: string }) {
    return <a onClick={e => e.stopPropagation()}
              href={`tg://user?id=${id}`} target={"_blank"}>
        <Image alt={"telegram"} src={telegram} width={24} height={24}/>
    </a>;
}