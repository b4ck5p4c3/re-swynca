import {MemberDTO} from "@/lib/types";
import React from "react";

export const SPACE_MEMBER_ID = "00000000-0000-0000-0000-000000000000";

export function MemberLink({member}: {member: MemberDTO}) {
    return member.id === SPACE_MEMBER_ID ? member.name :
        <a className={"underline"} href={`/dashboard/members/${member.id}`}
           target={"_blank"}>{member.name}</a>;
}