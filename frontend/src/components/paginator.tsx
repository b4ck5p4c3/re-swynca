import React from "react";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink, PaginationNext, PaginationPrevious
} from "@/components/ui/pagination";


export function Paginator({current, max, onChange}: {
    current: number,
    max: number,
    onChange: (page: number) => void
}) {
    const pages: React.ReactElement[] = [];
    if (max <= 6) {
        for (let i = 1; i <= max; i++) {
            pages.push(
                <PaginationItem key={i}>
                    <PaginationLink className={"cursor-pointer xs:w-9 w-7"}
                                    onClick={() => onChange(i)}
                                    isActive={i === current}
                    >
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }
    } else {
        for (let i = 1; i <= 2; i++) {
            pages.push(
                <PaginationItem key={i}>
                    <PaginationLink className={"cursor-pointer xs:w-9 w-7"}
                                    onClick={() => onChange(i)}
                                    isActive={i === current}
                    >
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }
        if (2 < current && current < max - 1) {
            pages.push(<PaginationEllipsis className={"xs:w-9 w-7"}/>)
            pages.push(
                <PaginationItem key={current}>
                    <PaginationLink className={"cursor-pointer xs:w-9 w-7"}
                                    onClick={() => onChange(current)}
                                    isActive={true}
                    >
                        {current}
                    </PaginationLink>
                </PaginationItem>
            );
        }
        pages.push(<PaginationEllipsis className={"xs:w-9 w-7"}/>)
        for (let i = max - 1; i <= max; i++) {
            pages.push(
                <PaginationItem key={i}>
                    <PaginationLink className={"cursor-pointer xs:w-9 w-7"}
                                    onClick={() => onChange(i)}
                                    isActive={i === current}
                    >
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }
    }
    return <Pagination>
        <PaginationContent className={"xs:gap-1 gap-0"}>
            {current !== 1 ?
                <PaginationItem>
                    <PaginationPrevious className={"cursor-pointer"} onClick={() => onChange(current - 1)}/>
                </PaginationItem> :
                <PaginationItem>
                    <PaginationPrevious className={"opacity-0 cursor-default"}/>
                </PaginationItem>}
            <div className={"sm:min-w-[300px] flex flex-row justify-center"}>
                {pages}
            </div>
            {current !== max && max >= 1 ?
                <PaginationItem>
                    <PaginationNext className={"cursor-pointer"} onClick={() => onChange(current + 1)}/>
                </PaginationItem> :
                <PaginationItem>
                    <PaginationNext className={"opacity-0 cursor-default"}/>
                </PaginationItem>}
        </PaginationContent>
    </Pagination>;
}
