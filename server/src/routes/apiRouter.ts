import { Router } from 'express';
import { HttpStatusCode } from 'axios';
import { destroyRoom, fetchLiveList } from '@src/services/api';

const apiRouter = Router();

apiRouter.post('/destroy_room', async (req, res) => {
  const { roomId } = req.body;
  if (!roomId) {
    res.send({ code: HttpStatusCode.BadRequest, message: "roomId is required" });
    return;
  }
  try {
    const response = await destroyRoom(String(roomId));
    res.send(response);
  } catch (error) {
    res.send(error);
  }
})

apiRouter.get('/get_live_list', async (req, res) => {
  const { next, count } = req.query;
  try {
    const response = await fetchLiveList(String(next), Number(count));
    res.send(response);
  } catch (error) {
    res.send(error);
  }
})


export {
  apiRouter,
}