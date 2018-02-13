import { createWriteStream } from "fs";
import * as shortid from "shortid";
import { forwardTo } from "prisma-binding";

import { getUserId, Context } from "../../utils";

const storeUpload = async ({ stream, filename }): Promise<any> => {
  const path = `images/${shortid.generate()}`;

  return new Promise((resolve, reject) =>
    stream
      .pipe(createWriteStream(path))
      .on("finish", () => resolve({ path }))
      .on("error", reject)
  );
};

const processUpload = async upload => {
  const { stream, filename, mimetype, encoding } = await upload;
  const { path } = await storeUpload({ stream, filename });
  return path;
};

export const product = {
  deleteProduct: forwardTo("db"),
  async updateProduct(
    parent,
    { id, name, price, picture },
    ctx: Context,
    info
  ) {
    const userId = getUserId(ctx);
    const product = await ctx.db.query.product({ where: { id } });
    console.log(product);
    if (userId !== product.seller.id) {
      throw new Error("Not authorized");
    }

    let pictureUrl = null;
    if (picture) {
      pictureUrl = await processUpload(picture);
    }

    return ctx.db.mutation.updateProduct(
      {
        data: {
          name,
          price,
          pictureUrl
        },
        where: {
          id
        }
      },
      info
    );
  },
  async createProduct(parent, { name, price, picture }, ctx: Context, info) {
    const userId = getUserId(ctx);
    const pictureUrl = await processUpload(picture);

    return ctx.db.mutation.createProduct(
      {
        data: {
          name,
          price,
          pictureUrl,
          seller: {
            connect: { id: userId }
          }
        }
      },
      info
    );
  }
};
