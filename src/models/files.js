import joi from 'joi';

export const uploadFilesSchema = joi.object().keys({
  title: joi.string().required().messages({
    'string.empty': 'Harap isi title'
  }),
  description: joi.string().required().messages({
    'string.empty': 'Harap isi description'
  }),
  // thumbnail: joi.string().required().messages({
  //   'string.empty': 'Harap isi thumbnail'
  // }),
  file_type: joi.string().required().messages({
    'string.empty': 'Harap isi file_type'
  }),
  // file_path: joi.string().required().messages({
  //     'string.empty': 'Harap isi file_path'
  // }),
  tags_id: joi.string().required().messages({
      'string.empty': 'Harap isi tags'
  }),
  categories_id: joi.string().required().messages({
    'string.empty': 'Harap isi category'
  }),
  item_id: joi.string().required().messages({
    'string.empty': 'Harap isi item id'
  })
});

export const uploadIconSchema = joi.object().keys({
  title: joi.string().required().messages({
    'string.empty': 'Harap isi title'
  }),
  description: joi.string().required().messages({
    'string.empty': 'Harap isi description'
  }),
  // thumbnail: joi.string().required().messages({
  //   'string.empty': 'Harap isi thumbnail'
  // }),
  file_type: joi.string().required().messages({
    'string.empty': 'Harap isi file_type'
  }),
  icon_url: joi.string().required().messages({
      'string.empty': 'Harap isi icon_url'
  }),
  tags_id: joi.string().required().messages({
      'string.empty': 'Harap isi tags'
  }),
  categories_id: joi.string().required().messages({
    'string.empty': 'Harap isi category'
  }),
  item_id: joi.string().required().messages({
    'string.empty': 'Harap isi item id'
  })
});