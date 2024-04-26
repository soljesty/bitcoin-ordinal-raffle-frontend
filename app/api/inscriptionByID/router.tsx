import { NextRequest } from "next/server";

// Fetch a inscriptions using wallet address
export async function GET(_request: NextRequest) {
  try {
    const axios = require("axios");

    let config = {
      method: "get",
      url: `${process.env.NEXT_PUBLIC_BACKEND}`,
      // headers: {
      //     'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
      // }
    };

    const response = await axios.request(config);
    console.log(response);

    return Response.json(response.data);
  } catch (e) {
    console.log(e);
    return Response.json({ message: "Error in request" }, { status: 400 });
  }
}
