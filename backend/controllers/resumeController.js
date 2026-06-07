/* ============================================================
   BanaoCV — backend/controllers/resumeController.js
   Resume CRUD Controller
   ============================================================ */

const { supabase }   = require('../config/supabase');
const { cloudinary } = require('../config/cloudinary');
const { v4: uuid }   = require('uuid');

exports.getAll = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);
    res.json({ success: true, resumes: data });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, data, template, color } = req.body;
    const shareCode = uuid().split('-')[0].toUpperCase();

    const { data: resume, error } = await supabase
      .from('resumes')
      .insert({
        user_id    : req.user.id,
        title      : title || 'My Resume',
        data,
        template   : template || 'clean-fresher',
        color      : color || '#1B3A6B',
        share_code : shareCode,
        score      : 0,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    res.status(201).json({ success: true, resume });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { data: resume, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !resume) return res.status(404).json({ success: false, message: 'Resume nahi mila' });
    res.json({ success: true, resume });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { title, data, template, color, score } = req.body;
    const { error } = await supabase
      .from('resumes')
      .update({ title, data, template, color, score, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw new Error(error.message);
    res.json({ success: true, message: 'Resume save ho gaya!' });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw new Error(error.message);
    res.json({ success: true, message: 'Resume delete ho gaya!' });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Photo required' });

    const b64    = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder         : 'banaocv/photos',
      public_id      : `photo-${req.user.id}-${Date.now()}`,
      transformation : [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
    });

    res.json({ success: true, url: result.secure_url });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getShared = async (req, res) => {
  try {
    const { data: resume, error } = await supabase
      .from('resumes')
      .select('title, data, template, color')
      .eq('share_code', req.params.code)
      .single();

    if (error || !resume) return res.status(404).json({ success: false, message: 'Resume nahi mila' });

    // Increment view count
    await supabase.rpc('increment_views', { resume_code: req.params.code });

    res.json({ success: true, resume });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
