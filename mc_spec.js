/*
 * This source code is under the Unlicense
 */
/*
 * This test case is described for Jasmine.
 */
describe("MonadPrimus2", function() {
    const M = MonadPrimus2();
    const ok = (actual, expected) => expect(actual).toEqual(expected);
    const undef = void 0;
    const $ = v => (console.log(v), v);
    const toArray = a => M.List.foldr((accum, v) => accum.concat([v]))([])(a);

    beforeEach(function() {
    });

    describe("testing MonadPrimus2", function() {
        it("Maybe", () => {
            const Mb = M.Maybe(v => v === null || v === undef, null);

            ok(Mb.bind(2, v => 7 + v), 9);
            ok(Mb.bind(2, v => undef), null);
            ok(Mb.bind(null, v => 7 + v), null);
            ok(Mb.bind(undef, v => 7 + v), null);
            ok(Mb.unit(2), 2);
            ok(Mb.alter(2, 7), 2);
            ok(Mb.alter(2, null), 2);
            ok(Mb.alter(undef, 2), 2);
            ok(Mb.alter(undef, undef), null);
            ok(Mb.fmap(v => v * 2)(2), 4);
            ok(Mb.fmap(v => v * 2)(undef), null);
            ok(Mb.lift(2), 2);
            expect(() => Mb.lift(null)).toThrow();

            ok(Mb.bind(2, Mb.unit), 2);
            ok(Mb.bind(null, Mb.unit), null);
            ok(Mb.bind(Mb.unit(2), v => v * 2), 4);
            ok(Mb.bind(Mb.bind(2, v => v * 2), w => w + 2), 6);
            ok(Mb.bind(2, v => Mb.bind(v * 2, w => w + 2)), 6);
            ok(Mb.bind(Mb.bind(null, v => v * 2), w => w + 2), null);
            ok(Mb.bind(null, v => Mb.bind(v * 2, w => w + 2)), null);
        });

        it("MaybeT", () => {
            const S = M.StateT(M.Id);
            const Mb = M.MaybeT(S)(null);
            const getch = ([x, ...xs]) => [x, xs];

            ok(S.run(Mb.bind(getch, a => Mb.bind(getch, b => Mb.bind(getch, c => Mb.unit([a, b, c])))))("abcd"), [["a", "b", "c"], ["d"]]);
            ok(S.run(Mb.bind(getch, a => Mb.bind(_ => [null, []], b => Mb.bind(getch, c => Mb.unit([a, b, c])))))("abcd"), [null, []]);
            ok(S.run(Mb.bind(getch, a => Mb.bind(getch, b => Mb.bind(Mb.lift(_ => ["?", []]), c => Mb.unit([a, b, c])))))("abcd"), [["a", "b", "?"], []]);
        });

        it("Either", () => {
            const E = M.Either;

            ok(E.bind(2, v => 7 + v), 9);
            ok(E.bind(2, v => E.left("Error")).value, "Error");
            ok(E.bind(E.left("Error"), v => 7 + v).value, "Error");
            ok(E.leftRight(2), [undef, 2]);
            ok(E.leftRight(E.left("Error")), ["Error", undef]);
            ok(E.fmap(v => v * 2)(2), 4);
            ok(E.fmap(v => v * 2)(E.left("Error")).value, "Error");

            ok(E.bind(2, E.unit), 2);
            ok(E.bind(E.left("Error"), E.unit).value, "Error");
            ok(E.bind(E.unit(2), v => v * 2), 4);
            ok(E.bind(E.bind(2, v => v * 2), w => w + 2), 6);
            ok(E.bind(2, v => E.bind(v * 2, w => w + 2)), 6);
            ok(E.bind(E.bind(E.left("Error"), v => v * 2), w => w + 2).value, "Error");
            ok(E.bind(E.left("Error"), v => E.bind(v * 2, w => w + 2)).value, "Error");
        });

        it("Except", () => {
            const E = M.Either;
            const Ex = M.ExceptT(M.Id);

            ok(Ex.bind(2, v => 7 + v), 9);
            ok(Ex.bind(2, v => E.left("Error")).value, "Error");
            ok(Ex.bind(E.left("Error"), v => 7 + v).value, "Error");
            ok(Ex.throwE("Error").value, "Error");
            ok(Ex.catchE(Ex.bind(2, v => 7 + v), v => 0), 9);
            ok(Ex.catchE(Ex.bind(2, v => Ex.throwE("Error")), v => 0), 0);
            ok(Ex.fmap(v => v * 2)(2), 4);
            ok(Ex.fmap(v => v * 2)(Ex.throwE("Error")).value, "Error");

            ok(Ex.bind(2, Ex.unit), 2);
            ok(Ex.bind(E.left("Error"), Ex.unit).value, "Error");
            ok(Ex.bind(Ex.unit(2), v => v * 2), 4);
            ok(Ex.bind(Ex.bind(2, v => v * 2), w => w + 2), 6);
            ok(Ex.bind(2, v => Ex.bind(v * 2, w => w + 2)), 6);
            ok(Ex.bind(Ex.bind(E.left("Error"), v => v * 2), w => w + 2).value, "Error");
            ok(Ex.bind(E.left("Error"), v => Ex.bind(v * 2, w => w + 2)).value, "Error");
        });

        it("ExceptT", () => {
            const S = M.StateT(M.Id);
            const E = M.ExceptT(S);
            const getch = ([x, ...xs]) => [x, xs];

            ok(S.run(E.bind(getch, a => E.bind(getch, b => E.bind(getch, c => E.unit([a, b, c])))))("abcd"), [["a", "b", "c"], ["d"]]);
            ok(S.run(E.bind(getch, a => E.bind(_ => [M.Either.left("Error"), []], b => E.bind(getch, c => E.unit([a, b, c])))))("abcd")[0].value, "Error");
            ok(S.run(E.bind(getch, a => E.bind(_ => [M.Either.left("Error"), []], b => E.bind(getch, c => E.unit([a, b, c])))))("abcd")[1], []);
            ok(S.run(E.bind(getch, a => E.bind(getch, b => E.bind(E.lift(_ => ["?", []]), c => E.unit([a, b, c])))))("abcd"), [["a", "b", "?"], []]);
        });

        it("List", () => {
            const L = M.List;

            ok(toArray(L.bind(L.of(1, 2), v => L.of(v, v * 2))), [1, 2, 2, 4]);
            ok(toArray(L.alter(L.of(1, 2), L.unit(3))), [1, 2, 3]);
            ok(toArray(L.mappend(L.of(1, 2), L.unit(3))), [1, 2, 3]);
            ok(toArray(L.fmap(v => v * 2)(L.of(1, 2))), [2, 4]);

            ok(toArray(L.bind(L.of(1, 2), L.unit)), [1, 2]);
            ok(toArray(L.bind(L.unit(1), v => L.of(v * 2))), [2]);
            ok(toArray((v => L.of(v * 2))(1)), [2]);
            ok(toArray(L.bind(L.bind(L.of(1, 2), v => L.of(v, v * 2)), v => L.of(v, v + 1))), [1, 2, 2, 3, 2, 3, 4, 5]);
            ok(toArray(L.bind(L.of(1, 2), v => L.bind((v => L.of(v, v * 2))(v), v => L.of(v, v + 1)))), [1, 2, 2, 3, 2, 3, 4, 5]);

            ok(toArray(L.mappend(L.of(1, 2), L.mappend(L.of(3, 4), L.of(5, 6)))), [1, 2, 3, 4, 5, 6]);
            ok(toArray(L.mappend(L.mappend(L.of(1, 2), L.of(3, 4)), L.of(5, 6))), [1, 2, 3, 4, 5, 6]);
            ok(toArray(L.mappend(L.mempty, L.of(1, 2))), [1, 2]);
            ok(toArray(L.mappend(L.of(1, 2), L.mempty)), [1, 2]);
        });

        it("StateT", () => {
            const isNull = v => v === null || v === undef;
            const S = M.StateT(M.MaybeT(M.Id)(isNull, null));
            const getch = ([x, ...xs]) => isNull(x) ? null : [x, xs];

            ok(S.run(S.bind(getch, a => S.bind(getch, b => S.bind(getch, c => S.unit([a, b, c])))))("abcd"), [["a", "b", "c"], ["d"]]);
            ok(S.run(S.bind(getch, a => S.bind(_ => null, b => S.bind(getch, c => S.unit([a, b, c])))))("abcd"), null);
            ok(S.run(S.bind(getch, a => S.bind(getch, b => S.bind(S.lift("?"), c => S.unit([a, b, c])))))("abcd"), [["a", "b", "?"], ["c", "d"]]);
            ok(S.run(S.bind(getch, a => S.bind(getch, b => S.bind(S.get, c => S.unit([a, b, c])))))("abcd"), [["a", "b", ["c", "d"]], ["c", "d"]]);
            ok(S.run(S.bind(getch, a => S.bind(getch, b => S.bind(S.put(["a"]), c => S.unit([a, b, c])))))("abcd"), [["a", "b", undef], ["a"]]);
            ok(S.run(S.fmap(v => v.concat("!"))(S.bind(getch, a => S.bind(getch, b => S.bind(getch, c => S.unit([a, b, c]))))))("abcd"),
                [["a", "b", "c", "!"], ["d"]]);

            ok(S.run(S.bind(s => [s, 2], S.unit))(1), [1, 2]);
            ok(S.run(S.bind(S.unit(1), v => w => [w * 2, 1]))(1), [2, 1]);
            ok((v => [v * 2, 1])(1), [2, 1]);
            ok(S.run(S.bind(S.bind(v => [v * 2, 1], v => s => [v * 2, s + 1]), w => s => [w + 1, s]))(1), [5, 2]);
            ok(S.run(S.bind(v => [v * 2, 1], x => S.bind((v => s => [v * 2, s + 1])(x), w => s => [w + 1, s])))(1), [5, 2]);
        });

        it("ReaderT", () => {
            const isNull = v => v === null || v === undef;
            const R = M.ReaderT(M.MaybeT(M.Id)(isNull, null));

            ok(R.run(R.bind(_ => 1, a => R.bind(_ => 2, b => R.bind(R.ask, c => R.unit([a, b, c])))))(1), [1, 2, 1]);
            ok(R.run(R.bind(_ => 1, a => R.bind(_ => null, b => R.bind(R.ask, c => R.unit([a, b, c])))))(1), null);
            ok(R.run(R.bind(_ => 1, a => R.bind(R.lift(5), b => R.bind(R.ask, c => R.unit([a, b, c])))))(1), [1, 5, 1]);
            ok(R.run(R.fmap(v => v.concat(5))(R.bind(_ => 1, a => R.bind(_ => 2, b => R.bind(R.ask, c => R.unit([a, b, c]))))))(1), [1, 2, 1, 5]);

            ok(R.run(R.bind(s => s * 2, R.unit))(1), 2);
            ok(R.run(R.bind(R.unit(1), v => w => v + w))(2), 3);
            ok((v => w => v + w)(2)(1), 3);
            ok(R.run(R.bind(R.bind(v => v * 2, v => r => v + r), v => r => v + r))(1), 4);
            ok(R.run(R.bind(v => v * 2, x => R.bind((v => r => v + r)(x), v => r => v + r)))(1), 4);
        });

        it("WriterT", () => {
            const isNull = v => v === null || v === undef;
            const W = M.WriterT(M.MaybeT(M.Id)(isNull, null), { mappend: (s, t) => s.concat(t), mempty: [] });

            ok(W.run(W.bind(W.unit(1), a => W.bind(W.tell([1]), _ => W.unit(a)))), [1, [1]]);
            ok(W.run(W.bind(W.unit(1), a => W.bind(null, _ => W.unit(a)))), null);
            ok(W.run(W.bind(W.unit(1), a => W.bind(W.lift([1]), _ => W.unit(a)))), [1, []]);
            ok(W.run(W.bind(W.unit(1), a => W.bind(W.tell([1]), _ => W.bind(W.tell([2]), _ => W.unit(a))))), [1, [1, 2]]);

            ok(W.run(W.bind(W.monad([1, [2]]), W.unit)), [1, [2]]);
            ok(W.run(W.bind(W.unit(1), v => W.monad([v * 2, [v]]))), [2, [1]]);
            ok(W.run((v => W.monad([v * 2, [v]]))(1)), [2, [1]]);
            ok(W.run(W.bind(W.bind(W.monad([1, [1]]), v => W.unit(v * 2)), w => W.unit(w + 3))), [5, [1]]);
            ok(W.run(W.bind(W.monad([1, [1]]), v => W.bind(W.unit(v * 2), w => W.unit(w + 3)))), [5, [1]]);
        });

        it("Cont", () => {
            const C = M.Cont;
            const addCont = (x, y) => M.Cont.unit(x + y);
            const mulCont = (x, y) => M.Cont.unit(x * y);
            const squareCont = x => M.Cont.unit(x * x);
            const declCont = v => M.Cont.unit(v - 1);
            const gtCont = (v, w) => M.Cont.unit(v > w);
            const sumCont = (v, a) => C.bind(gtCont(v, 0),
                t1 => !t1 ? C.unit(a)
                          : C.bind(addCont(v, a),
                                t2 => C.bind(declCont(v),
                                t3 => sumCont(t3, t2))));
            let contr;
            const pythCont2 = (x, y) => C.bind(squareCont(x),
                t1 => C.bind(C.callCC(k => (contr = k, squareCont(y))),
                t2 => addCont(t1, t2)));

            ok(C.run(sumCont(10, 0))(v => v * 2), 110);
            ok(C.run(C.fmap(v => v + 1)(sumCont(10, 0)))(v => v * 2), 112);
            ok(C.run(pythCont2(3, 4))(v => v), 25);
            ok(C.run(contr(3))(v => v), 12);

            ok(C.run(C.bind(k => k(5), C.unit))(v => v), 5);
            ok(C.run(C.bind(C.unit(5), v => k => 2 + v))(v => v), 7);
            ok((v => k => 2 + v)(5)(v => v), 7);
            ok(C.run(C.bind(C.bind(k => k(5), v => k => 2 + v), v => k => 2 * v))(v => v), 7);
            ok(C.run(C.bind(k => k(5), x => C.bind((v => k => 2 + v)(x), v => k => 2 * v)))(v => v), 7);
        });

        it("from", () => {
            const Mb = M.MaybeT(M.Id)(null);
            const L = M.List;

            ok(Mb.from(7).from(6).from(5).select((x, y, z) => x + y + z), 18);
            ok(Mb.from(7).from(null).from(5).select((x, y, z) => x + y + z), null);
            ok(toArray(L.from(L.of(1, 2)).from(L.of(3, 4)).select((x, y) => x + y)), [4, 5, 5, 6]);
            ok(toArray(L.from(L.of(1, 2)).from(L.of(3, 4)).where((x, y) => x + y !== 5).select((x, y) => x + y)), [4, 6]);
        });

        it("join", () => {
            const L = M.List;

            ok(toArray(L.join(L.of(L.of(1, 2), L.of(3, 4, 5)))), [1, 2, 3, 4, 5]);
        });

        it("or", () => {
            const Mb = M.MaybeT(M.Id)(null);

            ok(Mb.or(7, 6, 5), 7);
            ok(Mb.or(7, null, null), 7);
            ok(Mb.or(null, null, 5), 5);
            ok(Mb.or(null, null, null), null);
        });
    });
});

