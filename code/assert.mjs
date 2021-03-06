// Forked under MIT from [uvu/assert](https://github.com/lukeed/uvu/blob/63be84b2355fa4db67b325f869e58416e0ba1069/src/assert.js
// to remove dependencies on diffing, ANSI coloring, and other larger utilities

import { dequal } from 'dequal';

export class Assertion extends Error {
	constructor(opts={}) {
		super(opts.message);
		this.name = 'Assertion';
		this.code = 'ERR_ASSERTION';
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
		this.details = opts.details || false;
		this.generated = !!opts.generated;
		this.operator = opts.operator;
		this.expects = opts.expects;
		this.actual = opts.actual;
	}
}

export function assert(bool, actual, expects, operator, detailer, backup, msg) {
	if (bool) return;
	let message = msg || backup;
	if (msg instanceof Error) throw msg;
	let details = detailer && detailer(actual, expects);
	throw new Assertion({ actual, expects, operator, message, details, generated: !msg });
}

export function ok(val, msg) {
	assert(!!val, false, true, 'ok', false, 'Expected value to be truthy', msg);
}

function is_ok(val, exp, msg) {
  assert(val === exp, val, exp, 'is', null, 'Expected values to be strictly equal:', msg);
}

export const is = /* #__PURE__ */ Object.assign(is_ok, {
  ok: is_ok,
  not(val, exp, msg) {
    assert(val !== exp, val, exp, 'is.not', false, 'Expected values not to be strictly equal', msg);
  },
})

export function equal(val, exp, msg) {
  if (!msg) msg = `value: ${val}, expect: ${exp}`
	assert(dequal(val, exp), val, exp, 'equal', null, 'Expected values to be deeply equal:', msg);
}

export function unreachable(msg) {
	assert(false, true, false, 'unreachable', false, 'Expected not to be reached!', msg);
}

export function type(val, exp, msg) {
	let tmp = typeof val;
	assert(tmp === exp, tmp, exp, 'type', false, `Expected "${tmp}" to be "${exp}"`, msg);
}

export function instance(val, exp, msg) {
	let name = '`' + (exp.name || exp.constructor.name) + '`';
	assert(val instanceof exp, val, exp, 'instance', false, `Expected value to be an instance of ${name}`, msg);
}

export function match(val, exp, msg) {
	if (typeof exp === 'string') {
		assert(val.includes(exp), val, exp, 'match', false, `Expected value to include "${exp}" substring`, msg);
	} else {
		assert(exp.test(val), val, exp, 'match', false, `Expected value to match \`${String(exp)}\` pattern`, msg);
	}
}

export function snapshot(val, exp, msg) {
	val=dedent(val); exp=dedent(exp);
	assert(val === exp, val, exp, 'snapshot', mini_line_compare, 'Expected value to match snapshot:', msg);
}

export function fixture(val, exp, msg) {
	val=dedent(val); exp=dedent(exp);
	assert(val === exp, val, exp, 'fixture', mini_line_compare, 'Expected value to match fixture:', msg);
}

export async function async_throws(blk, exp, msg) {
	try {
		await blk();
		assert(false, false, true, 'async_throws', false, 'Expected function to throw', msg);
	} catch (err) {
    exception(err, exp, msg);
  }
}
export function throws(blk, exp, msg) {
	try {
		blk();
		assert(false, false, true, 'throws', false, 'Expected function to throw', msg);
	} catch (err) {
    exception(err, exp, msg);
  }
}

export function exception(err, exp, msg) {
  if (err instanceof Assertion) throw err;

	if (!msg && typeof exp === 'string') {
		msg = exp; exp = null;
	}

  if (typeof exp === 'function') {
    assert(exp(err), false, true, 'throws', false, 'Expected function to throw matching exception', msg);
  } else if (exp instanceof RegExp) {
    assert(exp.test(err.message), false, true, 'throws', false, `Expected function to throw exception matching \`${String(exp)}\` pattern`, msg);
  }
}

// ---

function not_ok(val, msg) {
  assert(!val, true, false, 'not', false, 'Expected value to be falsey', msg); }

export const not = /* #__PURE__ */ Object.assign(not_ok, {
  ok: not_ok,
  equal(val, exp, msg) {
    if (!msg) msg = `value: ${val}, expect: ${exp}`
    assert(!dequal(val, exp), val, exp, 'not.equal', false, 'Expected values not to be deeply equal', msg);
  },

  type(val, exp, msg) {
    let tmp = typeof val;
    assert(tmp !== exp, tmp, exp, 'not.type', false, `Expected "${tmp}" not to be "${exp}"`, msg);
  },

  instance(val, exp, msg) {
    let name = '`' + (exp.name || exp.constructor.name) + '`';
    assert(!(val instanceof exp), val, exp, 'not.instance', false, `Expected value not to be an instance of ${name}`, msg);
  },

  snapshot(val, exp, msg) {
    val=dedent(val); exp=dedent(exp);
    assert(val !== exp, val, exp, 'not.snapshot', false, 'Expected value not to match snapshot', msg);
  },

  fixture(val, exp, msg) {
    val=dedent(val); exp=dedent(exp);
    assert(val !== exp, val, exp, 'not.fixture', false, 'Expected value not to match fixture', msg);
  },

  match(val, exp, msg) {
    if (typeof exp === 'string') {
      assert(!val.includes(exp), val, exp, 'not.match', false, `Expected value not to include "${exp}" substring`, msg);
    } else {
      assert(!exp.test(val), val, exp, 'not.match', false, `Expected value not to match \`${String(exp)}\` pattern`, msg);
    }
  },

  async async_throws(blk, exp, msg) {
    try {
      await blk();
    } catch (err) {
      not.exception(err, exp, msg);
    }
  },

  throws(blk, exp, msg) {
    try {
      blk();
    } catch (err) {
      not.exception(err, exp, msg);
    }
  },
  exception(err, exp, msg) {
    if (!msg && typeof exp === 'string') {
      msg = exp; exp = null;
    }

    if (typeof exp === 'function') {
      assert(!exp(err), true, false, 'not.throws', false, 'Expected function not to throw matching exception', msg);
    } else if (exp instanceof RegExp) {
      assert(!exp.test(err.message), true, false, 'not.throws', false, `Expected function not to throw exception matching \`${String(exp)}\` pattern`, msg);
    } else if (!exp) {
      assert(false, true, false, 'not.throws', false, 'Expected function not to throw', msg);
    }
  }
});




export function dedent(str) {
	str = str.replace(/\r?\n/g, '\n');
  let arr = str.match(/^[ \t]*(?=\S)/gm);
  let i = 0, min = 1/0, len = (arr||[]).length;
  for (; i < len; i++) min = Math.min(min, arr[i].length);
  return len && min ? str.replace(new RegExp(`^[ \\t]{${min}}`, 'gm'), '') : str;
}

export function mini_line_compare(input, expect) {
  input = input.split(/\r?\n/g);
  expect = expect.split(/\r?\n/g);

  let len = Math.max(input.length, expect.length);
  let padLen = `${len}`.length;

  let out = {};
  for (let i=0; i<len; i++) {
    let k = `${i+1}`.padStart(padLen, '0');
    out['<'+k] = input[i];
    out['>'+k] = expect[i];
  }
	return JSON.stringify(out, null, 0);
}

