/*
 * This source code is under the Unlicense
 */
const MonadPrimus2 = () => {
    const $ = v => (console.log(v), v);
    const undef = void 0;
    const konst = a => v => a;
    const dot = (f, g) => v => f(g(v));

    // explicit select
    const from = (type, wrapper) => {
        const wrap = wrapper ?? (v => v);
        const from = a => {
            let args = [a];
            let guards = [];
            const inner = (a, g, args, f, unit) => {
                if(a.length > 0) {
                    return type.bind(wrap(a[0]), v => inner(a.slice(1), g, args.concat([v]), f, unit));
                } else if(g.length > 0) {
                    return type.bind(
                        g[0](...args) ? type.unit(null) : type.empty,
                        _ => inner(a, g.slice(1), args, f, unit));
                } else {
                    return unit(f(...args));
                }
            };
            const select = unit => f => inner(args, guards, [], f, unit);
            const me = {
                from: a => {
                    args.push(a);
                    return me;
                },

                where: f => {
                    guards.push(f);
                    return meWhere;
                },

                select: select(type.unit),
                selectNotUnit: select(v => v)
            };
            const meWhere = {
                where: f => {
                    guards.push(f);
                    return meWhere;
                },

                select: select(type.unit),
                selectNotUnit: select(v => v)
            }

            return me;
        };

        return { from: from };
    };

    class Monad {
        constructor(v) {
            this._run = v;
        }

        get run() {
            return this._run;
        }
    }
    const monad = v => new Monad(v);
    const run = m => m instanceof Monad ? m.run : m;

    const addMonadic = type => {
        type.liftM = f => m => type.bind(m, x => type.unit(f(x)));
        type.run = type.run ?? run;
        type.monad = type.monad ?? monad;
        type.from = from(type).from;
        type.join = type.join ?? (x => type.bind(x, v => v));
        type.or = (first, ...rest) => rest.reduce((accum, v) => type.alter(accum, v), first);
        type.mconcat = (...args) => args.length === 0 ? type.mempty : type.mappend(args[0], type.mconcat(args.slice(1)));
        return type;
    };

    // Identity monad
    const Id = addMonadic({ bind: (v, f) => f(v), unit: v => v, fmap: f => v => f(v) });

    // MaybeT monad transformer
    const MaybeT = type => (pred, nothingValue) => {
        const isNothing = v => typeof pred === "function" ? pred(v) : v === pred;
        const nothing = typeof pred === "function" ? nothingValue : pred;
        const nothingType = v => isNothing(v) ? nothing : v;
        const bind = (v, f) => type.bind(v, val => isNothing(val) ? type.unit(nothing) : nothingType(f(val)));
        const unit = v => type.unit(v);
        const alter = (v, w) => !isNothing(v) ? v : !isNothing(w) ? w : nothing;
        const empty = nothing;
        const fmap = f => v => isNothing(v) ? nothing : type.fmap(f)(v);
        const lift = type.liftM(v => {
            if(isNothing(v)) {
                throw new Error("Value must not me nothing" + v);
            }
            return v;
        });

        return addMonadic({ bind: bind, unit: unit, alter: alter, empty: empty, fmap: fmap, lift: lift });
    };
    const Maybe = MaybeT(Id);

    // Either monad
    const EitherType = () => {
        class Left {
            constructor(left) {
                this._left = left;
            }

            get value() {
                return this._left;
            }
        };
        const bind = (v, f) => v instanceof Left ? v : f(v);
        const unit = v => v;

        return addMonadic({
            bind: bind,
            unit: unit,
            right: v => unit(v),
            left: e => new Left(e),
            isRight: v => !(v instanceof Left),
            leftRight: v => v instanceof Left ? [v.value, undef] : [undef, v],
            fmap: f => v => v instanceof Left ? v : f(v)
        });
    };
    const Either = EitherType();

    // ExceptT monad transformer
    const ExceptT = type => {
        const bind = (m, k) => type.bind(m, a => Either.isRight(a) ? k(a) : type.unit(a));
        const unit = a => type.unit(Either.right(a));
        const throwE = dot(type.unit, Either.left);
        const catchE = (m, h) => type.bind(m, a => Either.isRight(a) ? type.unit(a) : h(a.value));
        const fmap = f => type.fmap(Either.fmap(f));
        const lift = type.liftM(Either.right);

        return addMonadic({ bind: bind, unit: unit, throwE: throwE, catchE: catchE, fmap: fmap, lift: lift });
    };

    // List monad
    const car = Symbol("car");
    const cdr = Symbol("cdr");
    const nil = Symbol("nil");
    const pair = (a, d) => ({ [car]: a, [cdr]: d });
    const tail = a => a[cdr]();
    const listAppend = (a, c) => a === nil ? c : pair(a[car], () => listAppend(tail(a), c));
    const listIota = (v, w) => v > w ? nil : pair(v, () => listIota(v + 1, w));
    const List = addMonadic({
        of: (...args) => args.length === 0 ? nil : pair(args[0], () => List.of(...args.slice(1))),
        join: a => a === nil ? nil : a[car] === nil ? List.join(tail(a)) : pair(a[car][car], () => List.join(listAppend(List.of(tail(a[car])), tail(a)))),
        bind: (v, f) => List.join(List.fmap(f)(v)),
        unit: v => List.of(v),
        alter: listAppend,
        empty: nil,
        mappend: listAppend,
        mempty: nil,
        fmap: f => a => a === nil ? nil : pair(f(a[car]), () => List.fmap(f)(tail(a))),
        foldr: f => init => a => a === nil ? init : List.foldr(f)(f(init, a[car]))(tail(a)),
        head: n => a => a === nil || n <= 0 ? nil : pair(a[car], () => List.head(n - 1)(tail(a)))
    });

    // State monad and its transformer
    const StateT = type => {
        const bind = (v, f) => monad(s => type.bind(run(v)(s), ([r, s1]) => run(f(r))(s1)));
        const unit = a => monad(s => type.unit([a, s]));
        const get = monad(s => [s, s]);
        const put = s => monad(_ => [undef, s]);
        const fmap = f => m => monad(s => type.fmap(([a, s1]) => [f(a), s1])(run(m)(s)));
        const lift = m => monad(s => type.bind(m, a => type.unit([a, s])));

        return addMonadic({ bind: bind, unit: unit, get: get, put: put, fmap: fmap, lift: lift });
    };

    // Reader monad
    const ReaderT = type => {
        const bind = (m, k) => monad(r => type.bind(run(m)(r), a => run(k(a))(r)));
        const lift = m => monad(konst(m));
        const unit = dot(lift, type.unit);
        const ask = monad(type.unit);
        const mapReaderT = f => m => monad(dot(f, run(m)));
        const fmap = f => mapReaderT(type.fmap(f));

        return addMonadic({ bind: bind, unit: unit, lift: lift, ask: ask, fmap: fmap });
    };

    // Writer monad
    const WriterT = (type, monoid) => {
        const bind = (m, k) => monad(type.bind(run(m), ([a, w]) => type.bind(run(k(a)), ([b, w1]) => type.unit([b, monoid.mappend(w, w1)]))));
        const unit = a => monad([a, monoid.mempty]);
        const lift = m => monad(type.bind(m, a => type.unit([a, monoid.mempty])));
        const tell = w => monad([null, w]);
        const mapWriterT = f => m => monad(f(run(m)));
        const fmap = f => mapWriterT(type.fmap)(([a, w]) => [f(a), w]);

        return addMonadic({ bind: bind, unit: unit, lift: lift, tell: tell, fmap: fmap });
    };

    // Continuation monad
    const ContT = type => {
        const bind = (m, k) => monad(c => run(m)(x => run(k(x))(c)));
        const unit = x => monad(k => k(x));
        const callCC = f => monad(c => run(f(x => monad(_ => c(x))))(c));
        const fmap = f => m => monad(c => run(m)(dot(c, f)));
        const lift = m => monad(v => m(v));

        return addMonadic({ bind: bind, unit: unit, callCC: callCC, fmap: fmap, lift: lift });
    };
    const Cont = ContT(Id);

    const me = {
        MakeFrom: type => from(type),
        Id: Id,
        MaybeT: MaybeT,
        Maybe: Maybe,
        Either: Either,
        ExceptT: ExceptT,
        List: List,
        R: listIota,
        StateT: StateT,
        ReaderT: ReaderT,
        WriterT: WriterT,
        //ContT: ContT,
        Cont: Cont
    };

    return me;
};

