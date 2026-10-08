import assert from "node:assert/strict";
import test from "node:test";
import { contrastRatio, isReadableOnBoth, onColor } from "./color.ts";

test("palette colors always get readable text", () => {
    for (const bg of ["#5B3DF5", "#FF5A36", "#00B67A", "#FF5C9E", "#18B8F0", "#FFD84A"]) {
        assert.ok(contrastRatio(onColor(bg), bg) >= 4.5, bg);
    }
});

test("picks white on dark and ink on light", () => {
    assert.equal(onColor("#5B3DF5"), "#FFFFFF");
    assert.equal(onColor("#FF5A36"), "#1E1633");
    assert.equal(onColor("#18B8F0"), "#1E1633");
});

test("flags colors where neither ink nor white reaches 4.5:1", () => {
    assert.equal(isReadableOnBoth("#808080"), false);
});
