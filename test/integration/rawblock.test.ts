import { describe, expect, it } from "vitest";

const BLOCK_HASH =
    "0000000000000bae09a7a393a8acded75aa67e46cb81f7acaa5ad94f9eacd103";

type RawBlock = {
    hash: string;
    ver: number;
    prev_block: string;
    mrkl_root: string;
    time: number;
    bits: number;
    nonce: number;
    n_tx: number;
    size: number;
    block_index: number;
    main_chain: boolean;
    height: number;
    received_time: number;
    relayed_by: string;
    tx: unknown[];
}

describe("Blockchain.info rawblock integration", () => {
    it("it must fetchs and validate all fields in the block", async () => {
        const response = await fetch(`https://blockchain.info/rawblock/${BLOCK_HASH}`);
        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);

        const data = await response.json() as RawBlock;
        console.log(data);

        expect(typeof data.hash).toBe("string");
        expect(typeof data.ver).toBe("number");
        expect(typeof data.prev_block).toBe("string");
        expect(typeof data.mrkl_root).toBe("string");
        expect(typeof data.time).toBe("number");
        expect(typeof data.bits).toBe("number");
        expect(typeof data.nonce).toBe("number");
        expect(typeof data.n_tx).toBe("number");
        expect(typeof data.size).toBe("number");
        expect(typeof data.block_index).toBe("number");
        expect(typeof data.main_chain).toBe("boolean");
        expect(typeof data.height).toBe("number");
        expect(typeof data.received_time).toBe("undefined");
        expect(typeof data.relayed_by).toBe("undefined");
        expect(Array.isArray(data.tx)).toBe(true);

        expect(data.hash).toBe(BLOCK_HASH);
        expect(data.ver).toBe(1);
        expect(data.prev_block).toBe("00000000000007d0f98d9edca880a6c124e25095712df8952e0439ac7409738a");
        expect(data.mrkl_root).toBe("935aa0ed2e29a4b81e0c995c39e06995ecce7ddbebb26ed32d550a72e8200bf5");
        expect(data.time).toBe(1322131230);
        expect(data.bits).toBe(437129626);
        expect(data.nonce).toBe(2964215930);
        expect(data.n_tx).toBe(22);
        expect(data.size).toBe(9195);
        expect(data.block_index).toBe(154595);
        expect(data.main_chain).toBe(true);
        expect(data.height).toBe(154595);
        expect(data.tx.length).toBe(22);
    })
});