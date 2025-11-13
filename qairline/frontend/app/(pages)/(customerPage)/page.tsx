'use client'
import {useEffect, useState} from "react";
import "@/app/global/global.css";
import {useRouter} from "next/navigation";


export default function AutoDirectToHomepage() {
    const router = useRouter();

    useEffect(() => {
        router.push('/home');
    }, [router]);

    return null;
}
