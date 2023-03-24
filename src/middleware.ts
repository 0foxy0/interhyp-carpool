import { NextRequest, NextResponse } from "next/server";
import myConfig from "./config.json";

export const middleware = async (req: NextRequest) => {
  const currentUrl = req.nextUrl.pathname;

  if (currentUrl.startsWith("/api")) {
    const url = req.nextUrl.clone();
    url.pathname = "/";

    req.headers.get("authorization") &&
    req.headers.get("authorization") === process.env.AUTHORIZATION
      ? NextResponse.next()
      : NextResponse.redirect(url);
  }
};

export const config = { matcher: ["/api/:path*"] };
