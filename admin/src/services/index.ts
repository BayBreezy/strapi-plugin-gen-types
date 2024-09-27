import axios from "axios";
import { pluginName } from "../pluginId";

export const getInterfaces = async () => {
  const data = await axios.get(`/${pluginName}`);
  return data.data;
};
