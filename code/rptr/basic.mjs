export default {
  allow_parallel: false,

  declare_suite(headline, kind) {
    (this.suites || []).push({headline, kind})
    return {__proto__: this, tests: [], suites: []} },

  begin_main() { console.log('') },
  end_main(res, opt) {
    console.log(res)
    if (opt.process)
      opt.process.exit(res.fail ? 1 : 0)
  },
  begin(headline) { console.log('') },
  end(token, headline) { console.log('') },
  step(token, section, headline) {
    if ('tests' === section)
      console.log(`Section: "${headline}" [${section}]\n`)
  },


  declare_test(name, kind) {
    let ans = {name, kind}
    ;(this.tests || []).push(ans)
    return {__proto__: this, ans} },

  format_pass(name, ts1) {
    return { ok: true, msg: `${name} (${(.001*ts1).toFixed(3)}s)`} },

  format_error(name, err) {
    return {ok: false, msg: `${name} -- ${err}`} },

  test_result(name, kind, result, ts) {
    console.log(`  Test[${result.ok ? 'pass' : 'FAIL'} ${(.001*ts[0]).toFixed(3)}s]: ${result.msg}`)
    this.ans.result = result },
}
