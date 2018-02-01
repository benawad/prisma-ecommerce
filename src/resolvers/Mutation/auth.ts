import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { Context } from '../../utils'

export const auth = {
  async signup(parent, args, ctx: Context, info) {
    const password = await bcrypt.hash(args.password, 10)
    const user = await ctx.db.mutation.createUser({
      data: { ...args, password },
    })

    return {
      token: jwt.sign({ userId: user.id }, process.env.APP_SECRET),
      user,
    }
  },

  async login(parent, { email, password }, ctx: Context, info) {
    const user = await ctx.db.query.user({ where: { email } })
    if (!user) {
      return {
        error: {
          field: 'email',
          msg: 'No user found',
        }
      }
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return {
        error: {
          field: 'password',
          msg: 'Invalid password',
        }
      }
    }

    return {
      payload: {
        token: jwt.sign({ userId: user.id }, process.env.APP_SECRET),
        user,
      }
    }
  },
}
