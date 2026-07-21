const { Router } = require('express');
const {
  crearCurso,
  listarCursos,
  editarCurso,
  eliminarCurso,
} = require('../controllers/curso.controller');

const router = Router();

router.post('/', crearCurso);
router.get('/', listarCursos);
router.put('/:id', editarCurso);
router.delete('/:id', eliminarCurso);

module.exports = router;
