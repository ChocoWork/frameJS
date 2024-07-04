/* eslint-disable react/jsx-key */
import axios from 'axios'; // axiosライブラリをインポートします。これはHTTPリクエストを行うためのライブラリです。
import { Button } from "frames.js/next"; // frames.jsのButtonコンポーネントをインポートします。
import { frames } from "./frames"; // frames関数をインポートします。これはframe.jsの主要な関数で、ユーザーのメッセージに対する応答を生成します。
import { appURL } from "../utils"; // utilsからappURLをインポートします。
import Image from 'next/image'; // next/imageをインポートします。
import { log } from 'console';

type Cast = {
  text: string; // Cast型を定義します。これはFarcasterから取得するキャスト（投稿）の型です。
  timestamp: string;
  // 他のプロパティがある場合はここに追加します...
};

const frameGetHandler = frames(async (ctx) => { // frameHandler関数を定義します。この関数はframes関数によってラップされ、非同期処理を行います。

  return { // 応答を返します。これには画像、ボタン、状態が含まれます。
    image: "https://i.imgur.com/T8boYWM.png",
    buttons: [
      <Button action="post" target={{ pathname: "/", query: { op: "+" } }}>
        Check
      </Button>,
    ],
  };
});

//カロリー計算処理
const framePostHandler = frames(async (ctx) => { // frameHandler関数を定義します。この関数はframes関数によってラップされ、非同期処理を行います。

  console.log("DEBUG:ctx.messege.castId.fid");
  console.log(ctx.message?.castId?.fid);

  // --- 日本時間を計算する ---
  const today = new Date();
  today.setHours(today.getHours() + 9, 0, 0, 0);  // 現在の時間に9時間を加算し、分、秒、ミリ秒を0に設定

  // 日本時間での日付を取得
  const year = today.getFullYear();
  const month = today.getMonth();
  const date = today.getDate();

  // 日本時間の日付の0時0分0秒をUTC時間で作成
  const adjustedDate = new Date(Date.UTC(year, month, date));
  // console.log(adjustedDate.toISOString());

  // 7日前の日付を計算
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 7日前の日付の年、月、日を取得
  const yearSevenDaysAgo = sevenDaysAgo.getFullYear();
  const monthSevenDaysAgo = sevenDaysAgo.getMonth();
  const dateSevenDaysAgo = sevenDaysAgo.getDate();

  // 7日前の日付の0時0分0秒をUTC時間で作成
  const adjustedDateSevenDaysAgo = new Date(Date.UTC(yearSevenDaysAgo, monthSevenDaysAgo, dateSevenDaysAgo));

  let counter: number = ctx.state.counter; // ctx.stateからcounterを取得します。これは前回の状態を保持するための変数です。
  let weekly_counter: number = ctx.state.counter;
  let total_counter: number = ctx.state.counter;

  if (ctx.message) { // ユーザーからのメッセージがある場合、以下の処理を行います。
    // const fid = "372993"; // 仮のFID

    if (!ctx.message?.castId?.fid) {
      console.error("Error: actor or actor.fid is undefined");
      return { // エラーメッセージを表示します
        image: (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '10px'}}>
            <div style={{ display: 'flex', fontSize: '42px', fontWeight: 'bold', color: '#000', marginBottom: '10px' }}>Error</div>
            <div style={{ display: 'flex', fontSize: '35px', color: '#555', marginBottom: '20px' }}>FID is undefined.</div>
          </div>
        ),
        buttons: [
          <Button action="post" target={{ pathname: "/", query: { op: "+" } }}>Check</Button>,
          <Button action="link" target="https://warpcast.com/~/compose?text=Calorie+Consumption+Check.+Frame+by+%40choco-official.+If+you+like+this+frame%2C+Let%27s+join+%2Fdiet+channel%21+%0Ahttps%3A%2F%2Fframetest-h1qurrxg8-chocos-projects-7decb871.vercel.app">Share</Button>,
        ],
        state: { counter: counter },
      };
    }

    let fid = ctx.message?.requesterFid;
    // let fid = ctx.message?.castId?.fid; // ボタンを押したユーザーのFIDを取得します。
    // const fid = 384087; // ボタンを押したユーザーのFIDを取得します。choco
    // const fid = 372993; // ボタンを押したユーザーのFIDを取得します。kajiri
    console.log("DEBUG:FID");
    console.log(fid);

    let fid_str = fid.toString();
    console.log("DEBUG:FID_str");
    console.log(fid_str);

    const searchKeyword = "kcal"; // 検索キーワードを定義します。この例では、"kcal"を検索します。
    const url = `https://api.neynar.com/v1/farcaster/casts?fid=${fid_str}&parent_url=https%3A%2F%2Fwarpcast.com%2F~%2Fchannel%2Fdiet&viewerFid=0&limit=150`; // APIのURLを定義します。

    const headers = { // HTTPリクエストのヘッダーを定義します。
      accept: "application/json",
      api_key: "NEYNAR_API_DOCS"
    };

    try { // try-catchブロックを使用して、エラーハンドリングを行います。
      const response = await axios.get(url, { headers }); // axiosを使用してAPIからデータを取得します。
      const data = response.data; // レスポンスからデータを取得します。
      console.log("DEBUG:data");
      console.log(data);

      const texts = data.result.casts // 取得したデータからキャストをフィルタリングし、テキストを抽出します。
        // .filter((cast: Cast) => cast.text.includes(searchKeyword))
        // --- LV3:その日の消費カロリーを算出する START ---
        .filter((cast: Cast) => {
          // cast.timestampをDateオブジェクトに変換
          const cast_time = new Date(cast.timestamp);
          cast_time.setHours(cast_time.getHours() + 9, 0, 0, 0);

          // 年、月、日を抽出
          const cast_year = cast_time.getUTCFullYear();
          const cast_month = cast_time.getUTCMonth();
          const cast_date = cast_time.getUTCDate();

          // 抽出した年、月、日から新たなDateオブジェクトを作成（時間、分、秒は0に設定）
          const castDate = new Date(Date.UTC(cast_year, cast_month, cast_date));

          console.log(castDate);
          console.log(castDate.toISOString);
          
          // cast.timestampの年、月、日とadjustedDateが一致するかどうかをチェック
          return (adjustedDate.toISOString() === castDate.toISOString());
        })
        // --- LV3:その日の消費カロリーを算出する END ---
        .map((cast: Cast) => cast.text);

        console.log("DEBUG:data.result");
        console.log(data.result);
        // console.log("DEBUG:texts");
        // console.log(texts);

      const calories: number[] = texts // 抽出したテキストからカロリーを抽出します。
      // --- LV1:投稿に記載した特定の形式のカロリー量を合計して算出する START---
        // .map((text: string) => {
        //   const match = text.match(new RegExp(`(\\d+)\\s${searchKeyword}`));
        //   return match && match[1] ? parseInt(match[1], 10) : 0
        // })
        // .filter((calorie: number) => calorie > 0);
      // --- LV1:投稿に記載した特定の形式のカロリー量を合計して算出する END---

      // --- LV2:投稿に記載した特定の形式のカロリー量を合計して算出 START---
        .map((text: string) => {
          
          // テキストの長さを算出する
          const length = text.length;

          // 1投稿あたり100＋文字数に基づいて算出
          return 345 + (length * 13);
        });
      // --- LV2:投稿に記載した特定の形式のカロリー量を合計して算出 END---

      // console.log("DEBUG:number");
      // console.log(calories);

      const sum: number = calories.reduce((acc: number, calorie: number) => acc + calorie, 0); // 抽出したカロリーを合計します。

      counter = sum; // 合計したカロリーをcounterに代入します。

      // --- LV4:Weeklyの数値を算出する ---
      const weekly_texts = data.result.casts // 取得したデータからキャストをフィルタリングし、テキストを抽出します。
        // .filter((cast: Cast) => cast.text.includes(searchKeyword))
        // １週間以内のキャストのみにするためにタイムスタンプでフィルターする
        .filter((cast: Cast) => {
          // cast.timestampをDateオブジェクトに変換
          const cast_time_week = new Date(cast.timestamp);
          cast_time_week.setHours(cast_time_week.getHours() + 9, 0, 0, 0);

          // 年、月、日を抽出
          const cast_year_week = cast_time_week.getUTCFullYear();
          const cast_month_week = cast_time_week.getUTCMonth();
          const cast_date_week = cast_time_week.getUTCDate();

          // 抽出した年、月、日から新たなDateオブジェクトを作成（時間、分、秒は0に設定）
          const castDate_week = new Date(Date.UTC(cast_year_week, cast_month_week, cast_date_week));

          // console.log(adjustedDateSevenDaysAgo);
          // console.log(cast_time_week);
          
          return (adjustedDateSevenDaysAgo.getTime() <= castDate_week.getTime());
        })
        .map((cast: Cast) => cast.text);

        const weekly_calories: number[] = weekly_texts // 抽出したテキストからカロリーを抽出します。
      // --- LV1:投稿に記載した特定の形式のカロリー量を合計して算出する START---
        // .map((text: string) => {
        //   const match = text.match(new RegExp(`(\\d+)\\s${searchKeyword}`));
        //   return match && match[1] ? parseInt(match[1], 10) : 0
        // })
        // .filter((calorie: number) => calorie > 0);
      // --- LV1:投稿に記載した特定の形式のカロリー量を合計して算出する END---

      // --- LV2:投稿に記載した特定の形式のカロリー量を合計して算出 START---
        .map((text: string) => {
          
          // テキストの長さを算出する
          const length = text.length;

          // 1投稿あたり50＋文字数に基づいて算出
          return 345 + (length * 13);
        });
      // --- LV2:投稿に記載した特定の形式のカロリー量を合計して算出 END---

      // console.log("DEBUG:number");
      // console.log(calories);

      const weekly_sum: number = weekly_calories.reduce((acc: number, calorie: number) => acc + calorie, 0); // 抽出したカロリーを合計します。

      weekly_counter = weekly_sum; // 合計したカロリーをcounterに代入します。

      // --- LV5:通算消費カロリー計算 ---
      const total_texts = data.result.casts // 取得したデータからキャストをフィルタリングし、テキストを抽出します。
        // .filter((cast: Cast) => cast.text.includes(searchKeyword))
        .map((cast: Cast) => cast.text);

        const total_calories: number[] = total_texts // 抽出したテキストからカロリーを抽出します。
      // --- LV1:投稿に記載した特定の形式のカロリー量を合計して算出する START---
        // .map((text: string) => {
        //   const match = text.match(new RegExp(`(\\d+)\\s${searchKeyword}`));
        //   return match && match[1] ? parseInt(match[1], 10) : 0
        // })
        // .filter((calorie: number) => calorie > 0);
      // --- LV1:投稿に記載した特定の形式のカロリー量を合計して算出する END---

      // --- LV2:投稿に記載した特定の形式のカロリー量を合計して算出 START---
        .map((text: string) => {
          
          // テキストの長さを算出する
          const length = text.length;

          // 1投稿あたり50＋文字数に基づいて算出
          return 345 + (length * 13);
        });
      // --- LV2:投稿に記載した特定の形式のカロリー量を合計して算出 END---

      // console.log("DEBUG:number");
      // console.log(calories);

      const total_sum: number = total_calories.reduce((acc: number, calorie: number) => acc + calorie, 0); // 抽出したカロリーを合計します。

      total_counter = total_sum; // 合計したカロリーをcounterに代入します。
    } catch (error) { // エラーが発生した場合、エラーメッセージをコンソールに出力します。
      console.error("Error fetching data:", error);
    }
  }
  return { // 応答を返します。これには画像、ボタン、状態が含まれます。
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '10px'}}>
        <div style={{ display: 'flex', fontSize: '42px', fontWeight: 'bold', color: '#000', marginBottom: '10px' }}>Calories extinguished by casting</div>
        <div style={{ display: 'flex', fontSize: '35px', color: '#555', marginBottom: '20px' }}>Daily: {counter} kcal</div>
        <div style={{ display: 'flex', fontSize: '35px', color: '#555', marginBottom: '20px' }}>Weekly: {weekly_counter} kcal</div>
        <div style={{ display: 'flex', fontSize: '35px', color: '#555', marginBottom: '20px' }}>Total: {total_counter} kcal</div>
        <div tw="flex">Message from {ctx.message?.requesterFid}</div>
      </div>
    ),
    buttons: [
      <Button action="post" target={{ pathname: "/", query: { op: "+" } }}>Check</Button>,
      <Button action="link" target="https://warpcast.com/~/compose?text=Calorie+Consumption+Check.+Frame+by+%40choco-official.+If+you+like+this+frame%2C+Let%27s+join+%2Fdiet+channel%21+%0Ahttps%3A%2F%2Fframetest-g9ipe4hzp-chocos-projects-7decb871.vercel.app">Share</Button>,
    ],
    state: { 
      counter: counter, 
      weekly_counter: weekly_counter,
      total_counter: total_counter,
    },
  };
});

export const GET = frameGetHandler; // GETリクエストのハンドラとしてframeHandlerをエクスポートします。
export const POST = framePostHandler; // POSTリクエストのハンドラとしてもframeHandlerをエクスポートします。
