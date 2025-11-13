import { Router } from 'express';
import { AircraftController } from '../controllers/AircraftController';

const router = Router();
const controller = new AircraftController();

router.get('/GetAll', controller.getAll);
router.post('/Add', controller.add);
router.post('/Edit', controller.edit);
router.post('/Delete', controller.delete);

export default router;
