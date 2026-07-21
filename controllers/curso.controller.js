const { Curso } = require('../models');

const crearCurso = async (req, res) => {
  try {
    const curso = await Curso.create(req.body);
    res.status(201).json(curso);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const listarCursos = async (req, res) => {
  try {
    const cursos = await Curso.findAll({
      order: [['fechaInicio', 'ASC']],
    });
    res.json(cursos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const editarCurso = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }
    await curso.update(req.body);
    res.json(curso);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const eliminarCurso = async (req, res) => {
  try {
    const curso = await Curso.findByPk(req.params.id);
    if (!curso) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }
    await curso.destroy();
    res.json({ mensaje: 'Curso eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearCurso,
  listarCursos,
  editarCurso,
  eliminarCurso,
};
