/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
module.exports = async (ctx, next) => {
  const type = ctx.params.type;
  console.log(type);

  const body = ctx.request.body;
  // console.log(body.data);

  await next();
};
