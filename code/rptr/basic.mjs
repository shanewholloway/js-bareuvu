export default {
  declare_suite(headline, kind) {
    (this.suites || []).push({headline, kind})
    return {__proto__: this, tests: [], suites: []} },

  begin(headline) { console.log('') },
  end(token, headline) { console.log('') },
  info(token, section, headline) {
    if ('tests' === section)
      console.log(`Section: "${headline}" [${section}]\n`)
  },


  declare_test(name, kind) {
    let ans = {name, kind}
    ;(this.tests || []).push(ans)
    return {__proto__: this, ans} },

  format_pass(name, ts1) {
    return { ok: true, msg: `test: ${name} passed (${ts1.toFixed(3)}s)`} },

  format_error(name, err) {
    return {ok: false, msg: `test: ${name} failed: ${err}`} },

  test_result(name, kind, result, ts) {
    console.log(`  Test[${(ts[0]).toFixed(3)}s]: "${name}" -- ${result.msg}`)
    this.ans.result = result },
}
