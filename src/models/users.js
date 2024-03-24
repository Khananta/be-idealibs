import joi from 'joi';
const regex = /^(?=.*[a-z])(?=.*[A-Z])/

export const userSchema = joi.object().keys({
  username: joi.string().required().messages({
    'string.empty': 'Harap isi Username'
  }),
  email: joi.string().email().required().messages({
    'string.empty': 'Harap isi Email',
  }),
  password: joi.string().min(6).regex(regex).required().messages({
    'string.empty': 'Harap isi Password',
    'string.min': 'Harap isi password minimal 6 karakter ',
    'string.pattern.base': 'Harap Minimal satu huruf besar'
  }),
  confirmPassword: joi.string().min(6).regex(regex).required().messages({
    'string.empty': 'Harap isi confirm Password',
    'string.min': 'Harap isi confirm password minimal 6 karakter ',
    'string.pattern.base': 'Harap Minimal satu huruf besar'
  })
})

export const signInSchema = joi.object({
  username: joi.string().messages({
    'string.empty': 'Harap isi Username'
  }),
  email: joi.string().email().messages({
    'string.empty': 'Harap isi Email',

  }),
  password: joi.string().required().messages({
    'string.empty': 'Harap isi Password',
    // 'string.min': 'Harap isi password minimal 6 karakter ',
    // 'string.pattern.base': 'Harap Minimal satu huruf besar'
  })
})