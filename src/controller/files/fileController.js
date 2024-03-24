import { uploadFilesSchema, uploadIconSchema } from '../../models/files.js'; 
import supabase from '../../config/supabase.js'
import { imageUpload } from '../../services/fileService.js';

export const createPost = async (req, res) => {
  try {
    if (!req.files.file_path) {
      res.status(422).json({
        status: 'fail',
        message: 'Image atau Proposal harus di upload'
      })
    }

    const { error, value } = uploadFilesSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const response = res.status(400).json({
        status: 'fail',
        message: `Upload Gagal, ${error.message}`
      })
      return response
    }

    const { title, description, file_type, tags_id, categories_id, item_id } = req.body;
    const { id } = req.params
    const { file_path } = req.files

    const imageUrl = await imageUpload('public', 'submission_images', file_path)

    const { data: submission, error: err } = await supabase
      .from('files')
      .insert({ title: title, description: description, file_path: imageUrl, file_type: file_type, tags_id: tags_id, user_id: id, categories_id: categories_id, item_id:item_id })
      .select()

    if (err) {
      const response = res.status(400).json({
        status: 'fail',
        message: `Upload Gagal, ${err.message}`
      })
      return response
    }

    return res.status(200).json({
      status: 'success',
      message: 'file uploaded successfully',
      data: submission
    })

  } catch (err) {
    return res.status(500).json({ status: 'error', error: err.message });
  }
}

export const createIcon = async (req, res) => {
  try {
    if (!req.files.file_path) {
      res.status(422).json({
        status: 'fail',
        message: 'Image atau Proposal harus di upload'
      })
    }

    const { error, value } = uploadIconSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const response = res.status(400).json({
        status: 'fail',
        message: `Upload Gagal, ${error.message}`
      })
      return response
    }
    console.log(req.body.title)
    const { title, description, file_type, tags_id, categories_id, item_id, icon_url } = req.body;
    const { id } = req.params
    const { file_path } = req.files

    const imageUrl = await imageUpload('public', 'submission_images', file_path)
  
    const { data: submission, error: err } = await supabase
      .from('icons')
      .insert({ title: title, description: description, file_path: imageUrl, file_type: file_type, tags_id: tags_id, user_id: id, categories_id: categories_id, item_id:item_id, icon_url:icon_url })
      .select()

    if (err) {
      const response = res.status(400).json({
        status: 'fail',
        message: `Upload Gagal, ${err.message}`
      })
      return response
    }

    return res.status(200).json({
      status: 'success',
      message: 'file uploaded successfully',
      data: submission
    })

  } catch (err) {
    return res.status(500).json({ status: 'error', error: err.message });
  }
};

export const addToCollection = async (req, res) => {
  const { user_id, file_id } = req.body;
  const { data, error } = await supabase
    .from('collections')
    .insert([{ user_id: user_id, file_id: file_id }]);
  
  if (error) return res.status(400).send(error);
  res.status(201).json({
    status: 'success',
    message: 'added to collections'
  });
};

export const getCollectionById = async (req, res) => {
  try {
    // Mendapatkan ID dari parameter request
    const { id } = req.params;

    // Query data dari tabel 'collections' dan tabel terkait
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select(`
          *,
          files(*,
                tags_id(tag),
                categories_id(category),
                item_id(item),
                user_id(username, email)
          ),
          users(username, email)
      `)
      .eq('user_id', id);

    // Jika terjadi kesalahan dalam query
    if (collectionError) {
      throw collectionError;
    }

    // Jika data tidak ditemukan
    if (!collection || collection.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'Collection not found',
      });
    }

    // Format tanggal dan pastikan files adalah sebuah array
    const formattedData = collection.map(item => {
      // Pastikan bahwa files adalah sebuah array
      const filesArray = Array.isArray(item.files) ? item.files : [item.files];
    
      // Format the created_at field for each file in the files array
      const formattedFiles = filesArray.map(file => {
        // Check if created_at is defined
        if (file.created_at) {
          // Format the date
          const formattedDate = new Date(file.created_at).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
    
          // Menggabungkan data yang diformat kembali ke objek file
          return {
            ...file,
            created_at: formattedDate,
          };
        } else {
          // Jika created_at tidak terdefinisi, kembalikan file tanpa perubahan
          return file;
        }
      });
    
      // Menggabungkan data yang diformat kembali ke objek item
      return {
        ...item,
        files: formattedFiles,
      };
    });
    
    
    
    
    // Jika berhasil mendapatkan data, kirim data sebagai respons
    res.status(200).json({
      status: 'success',
      data: formattedData,
    });
  } catch (err) {
    // Tangani kesalahan
    res.status(500).json({
      status: 'fail',
      message: `Server error: ${err.message}`,
    });
  }
};

export const getAllFiles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    const itemId = req.query.item_id;
    const categoryId = req.query.category_id;
    const searchQuery = req.query.search;

    // Membangun query dengan kondisi filter yang diberikan
    let query = supabase
      .from('files')
      .select('id, title, description, file_path, created_at, file_type, categories_id, tags_id, user_id', { count: 'exact' });

    // Menerapkan pencarian jika searchQuery disediakan
    if (searchQuery) {
      // Membangun string query untuk pencarian di kedua kolom
      const searchCondition = `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`;
      query = query.or(searchCondition);
    }
    
      // Menambahkan filter jika diberikan dalam query params
    if (itemId) {
      query = query.eq('item_id', itemId); // Perhatikan disini koreksi dari 'item_id' ke 'id'
    }

    if (categoryId) {
      query = query.eq('categories_id', categoryId);
    }

    // Melakukan query dengan filter dan pagination yang telah ditentukan
    const { data: files, error: filesError, count } = await query.range(offset, offset + limit - 1);

    if (filesError) {
      throw filesError;
    }

    const categories = {};
    const tags = {};
    const users = {};
    for (const file of files) {
      if (!categories[file.categories_id]) {
        let { data: category } = await supabase
          .from('categories')
          .select(`category`)
          .eq('id', file.categories_id)
          .single();
        categories[file.categories_id] = category.category;
      }
      if (!tags[file.tags_id]) {
        let { data: tag } = await supabase
          .from('tags')
          .select(`tag`)
          .eq('id', file.tags_id)
          .single();
        tags[file.tags_id] = tag.tag;
      }
      if (!users[file.user_id]) {
        let { data: user } = await supabase
          .from('users')
          .select(`username`)
          .eq('id', file.user_id)
          .single();
        users[file.user_id] = user.username;
      }
    }

    // Menambahkan category_name dan tag_name ke setiap file
    // const enrichedFiles = files.map(file => ({
    //   ...file,
    //   category_name: categories[file.categories_id],
    //   tag_name: tags[file.tags_id],
    //   username: users[file.user_id]
    // }));

    const totalPages = Math.ceil(count / limit);

    const formattedData = files.map(file => {
      // Menggunakan Date untuk memformat tanggal
      const formattedDate = new Date(file.created_at).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        
      });
    
      // Menggabungkan data yang diformat kembali ke objek
      return {
        ...file,
      category_name: categories[file.categories_id],
      tag_name: tags[file.tags_id],
      username: users[file.user_id],
        created_at: formattedDate
      };
    });

    
    res.status(200).json({
      status: 'success',
      data: formattedData,
      pagination: {
        totalItems: count,
        totalPages: totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: `Server error: ${err.message}`,
    });
  }
};

export const getAllIcons = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const itemId = req.query.item_id;
    const categoryId = req.query.category_id;
    const searchQuery = req.query.search;

    // Membangun query dengan kondisi filter yang diberikan
    let query = supabase
      .from('icons')
      .select('id, title, description, file_path, created_at, file_type, categories_id, tags_id, user_id, icon_url', { count: 'exact' });

    // Menerapkan pencarian jika searchQuery disediakan
    if (searchQuery) {
      // Membangun string query untuk pencarian di kedua kolom
      const searchCondition = `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`;
      query = query.or(searchCondition);
    }
    
      // Menambahkan filter jika diberikan dalam query params
    if (itemId) {
      query = query.eq('item_id', itemId); // Perhatikan disini koreksi dari 'item_id' ke 'id'
    }

    if (categoryId) {
      query = query.eq('categories_id', categoryId);
    }

    // Melakukan query dengan filter dan pagination yang telah ditentukan
    const { data: files, error: filesError, count } = await query.range(offset, offset + limit - 1);

    if (filesError) {
      throw filesError;
    }

    const categories = {};
    const tags = {};
    const users = {};
    for (const file of files) {
      if (!categories[file.categories_id]) {
        let { data: category } = await supabase
          .from('categories')
          .select(`category`)
          .eq('id', file.categories_id)
          .single();
        categories[file.categories_id] = category.category;
      }
      if (!tags[file.tags_id]) {
        let { data: tag } = await supabase
          .from('tags')
          .select(`tag`)
          .eq('id', file.tags_id)
          .single();
        tags[file.tags_id] = tag.tag;
      }
      if (!users[file.user_id]) {
        let { data: user } = await supabase
          .from('users')
          .select(`username`)
          .eq('id', file.user_id)
          .single();
        users[file.user_id] = user.username;
      }
    }

    // Menambahkan category_name dan tag_name ke setiap file
    // const enrichedIcons = files.map(file => ({
    //   ...file,
    //   category_name: categories[file.categories_id],
    //   tag_name: tags[file.tags_id],
    //   username: users[file.user_id]
    // }));

    const totalPages = Math.ceil(count / limit);

    const formattedData = files.map(file => {
      // Menggunakan Date untuk memformat tanggal
      const formattedDate = new Date(file.created_at).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        
      });
    
      // Menggabungkan data yang diformat kembali ke objek
      return {
        ...file,
      category_name: categories[file.categories_id],
      tag_name: tags[file.tags_id],
      username: users[file.user_id],
        created_at: formattedDate
      };
    });

    
    res.status(200).json({
      status: 'success',
      data: formattedData,
      pagination: {
        totalItems: count,
        totalPages: totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: `Server error: ${err.message}`,
    });
  }
};

export const getFileById = async (req, res) => {
  try {
    // Mendapatkan ID dari parameter request
    const { id } = req.params;

    // Query file berdasarkan ID dari tabel 'files'
    const { data: file, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .single(); // Gunakan .single() untuk mendapatkan objek tunggal, bukan array

    // Jika terjadi kesalahan dalam query
    if (error) {
      throw error;
    }

    // Jika file tidak ditemukan
    if (!file) {
      return res.status(404).json({
        status: 'fail',
        message: 'File not found',
      });
    }

    const { categories_id, tags_id, user_id, item_id } = file;

    // Mendapatkan kategori
    const { data: categoryData } = await supabase
      .from('categories')
      .select('category')
      .eq('id', categories_id)
      .single();
    const category_name = categoryData ? categoryData.category : null;

    // Mendapatkan tag
    const { data: tagData } = await supabase
      .from('tags')
      .select('tag')
      .eq('id', tags_id)
      .single();
    const tag_name = tagData ? tagData.tag : null;

    // Mendapatkan user
    const { data: userData } = await supabase
      .from('users')
      .select('username')
      .eq('id', user_id)
      .single();
    const username = userData ? userData.username : null;

    // Mendapatkan item
    const { data: itemData } = await supabase
      .from('items')
      .select('item')
      .eq('id', item_id)
      .single();
    const items = itemData ? itemData.item : null;

    // Format tanggal
    const formattedDate = new Date(file.created_at).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    // Menambahkan format tanggal yang diformat ke data file
    const fileWithFormattedDate = {
      ...file,
      category_name,
      tag_name,
      username,
      items,
      created_at: formattedDate
    };

    // Jika berhasil mendapatkan data, kirim data sebagai respons
    res.status(200).json({
      status: 'success',
      data: fileWithFormattedDate,
    });
  } catch (err) {
    // Tangani kesalahan
    res.status(500).json({
      status: 'fail',
      message: `Server error: ${err.message}`
    });
  }
};

export const getIconById = async (req, res) => {
  try {
    // Mendapatkan ID dari parameter request
    const { id } = req.params;

    // Query file berdasarkan ID dari tabel 'files'
    const { data: file, error } = await supabase
      .from('icons')
      .select('*')
      .eq('id', id)
      .single(); // Gunakan .single() untuk mendapatkan objek tunggal, bukan array

    // Jika terjadi kesalahan dalam query
    if (error) {
      throw error;
    }

    // Jika file tidak ditemukan
    if (!file) {
      return res.status(404).json({
        status: 'fail',
        message: 'File not found',
      });
    }

    const { categories_id, tags_id, user_id, item_id } = file;

    // Mendapatkan kategori
    const { data: categoryData } = await supabase
      .from('categories')
      .select('category')
      .eq('id', categories_id)
      .single();
    const category_name = categoryData ? categoryData.category : null;

    // Mendapatkan tag
    const { data: tagData } = await supabase
      .from('tags')
      .select('tag')
      .eq('id', tags_id)
      .single();
    const tag_name = tagData ? tagData.tag : null;

    // Mendapatkan user
    const { data: userData } = await supabase
      .from('users')
      .select('username')
      .eq('id', user_id)
      .single();
    const username = userData ? userData.username : null;

    // Mendapatkan item
    const { data: itemData } = await supabase
      .from('items')
      .select('item')
      .eq('id', item_id)
      .single();
    const items = itemData ? itemData.item : null;

    // Format tanggal
    const formattedDate = new Date(file.created_at).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    // Menambahkan format tanggal yang diformat ke data file
    const fileWithFormattedDate = {
      ...file,
      category_name,
      tag_name,
      username,
      items,
      created_at: formattedDate
    };

    // Jika berhasil mendapatkan data, kirim data sebagai respons
    res.status(200).json({
      status: 'success',
      data: fileWithFormattedDate,
    });
  } catch (err) {
    // Tangani kesalahan
    res.status(500).json({
      status: 'fail',
      message: `Server error: ${err.message}`
    });
  }
};

export const createPalette = async (req, res) => {
  try {
    const { hex } = req.body;
    const { id } = req.params;

    // Memastikan array hex memiliki panjang 4
    if (!Array.isArray(hex) || hex.length !== 4) {
      return res.status(400).json({ message: 'Invalid input: hex must be an array of 4 hex codes' });
    }

    // Validasi kode warna
    const validHex = hex.filter(hex => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex));
    if (validHex.length !== hex.length) {
      return res.status(400).json({ message: 'Invalid color format' });
    }

    // Menggabungkan kode warna menjadi satu string
    const paletteString = hex.join(',');

    // Simpan palet warna ke dalam database
    const { data, error } = await supabase.from('colors').insert([
      { hex: paletteString, user_id: id }
    ]);

    if (error) {
      throw error;
    }

    // Berhasil menyimpan palet warna
    return res.status(200).json({
      status: 'success',
      message: 'file uploaded successfully'
    })

  } catch (err) {
    return res.status(500).json({ status: 'error', error: err.message });
  }
}

export const getAllPalettes = async (req, res) => {
  try {
    // Query semua palet warna dari database
    const { data: palettes, error: paletteError } = await supabase.from('colors').select('id, user_id, hex, created_at');

    if (paletteError) {
      throw paletteError;
    }

    // Array untuk menyimpan hasil akhir
    const finalPalettes = [];

    // Loop melalui setiap palet
    for (const palette of palettes) {
      // Membuat array warna dari hex yang disimpan di database
      const hexColors = palette.hex.split(',').filter(color => color !== ''); // Memisahkan hex menjadi array warna dan menghapus warna kosong

      // Mendapatkan username berdasarkan user_id
      const { data: userData, error: userError } = await supabase.from('users').select('username').eq('id', palette.user_id).single();

      if (userError) {
        throw userError;
      }

      // Format tanggal
      const createdAt = new Date(palette.created_at);
      const formattedDate = createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      // Menambahkan username dan tanggal pembuatan ke dalam palet
      const paletteWithUsernameAndDate = {
        id: palette.id,
        user_id: palette.user_id,
        username: userData.username,
        hex: hexColors,
        created_at: formattedDate
      };

      // Menambahkan palet yang telah diperbarui ke dalam array final
      finalPalettes.push(paletteWithUsernameAndDate);
    }

    // Mengembalikan data sebagai respons
    return res.status(200).json({
      status: 'success',
      data: finalPalettes
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', error: err.message });
  }
};


export const getPaletteById = async (req, res) => {
  try {
    // Mendapatkan ID palet warna dari parameter request
    const { id } = req.params;

    // Query palet warna berdasarkan ID dari database
    const { data, error } = await supabase
      .from('colors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    // Jika palet warna tidak ditemukan
    if (!data) {
      return res.status(404).json({
        status: 'fail',
        message: 'Palette not found',
      });
    }

    // Memisahkan hex menjadi array warna
    const hexColors = data.hex.split(',').filter(color => color !== ''); // Memisahkan hex menjadi array warna dan menghapus warna kosong

    // Mendapatkan username berdasarkan user_id
    const { data: userData, userError } = await supabase.from('users').select('username').eq('id', data.user_id).single();

    if (userError) {
      throw userError;
    }

    // Format tanggal
    const createdAt = new Date(data.created_at);
    const formattedDate = createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Jika berhasil mendapatkan data, kirim data sebagai respons
    return res.status(200).json({
      status: 'success',
      data: {
        id: data.id,
        user_id: data.user_id,
        username: userData.username,
        hex: hexColors,
        created_at: formattedDate
      }
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', error: err.message });
  }
};