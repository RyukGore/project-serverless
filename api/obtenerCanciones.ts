import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as path from "path";

// Cambia 'NOMBRE_REAL_DE_TU_ARCHIVO.json' con el nombre EXACTO de tu clave JSON en la raíz
const NOMBRE_ARCHIVO_JSON = "canciones-serverless-firebase-admin.json";

const rutaClave = path.join(process.cwd(), NOMBRE_ARCHIVO_JSON);
const serviceAccount = require(rutaClave);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();
const COLECCION = "spotify_history"; // El nombre de la colección en Firestore

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const idBuscado = req.query.id as string;
    const limiteParam = req.query.limit as string;
    const plataformaParam = req.query.platform as string;

    // CASO 1: Búsqueda exacta por ID
    if (idBuscado) {
      const docRef = await db.collection(COLECCION).doc(idBuscado).get();

      if (!docRef.exists) {
        return res.status(404).json({
          exito: false,
          mensaje: `No se encontró ninguna canción con el ID: ${idBuscado}`,
        });
      }

      return res.status(200).json({
        exito: true,
        tipo: "busqueda_id",
        data: { id: docRef.id, ...docRef.data() },
      });
    }

    // CASO 2: Listado general con soporte de Filtro por Plataforma y Límite dinámico
    let query: FirebaseFirestore.Query = db.collection(COLECCION);

    // Si el cliente envía ?platform=web player o ?platform=windows, aplicamos el filtro
    if (plataformaParam) {
      query = query.where("platform", "==", plataformaParam);
    }

    // Definir límite (si se pasa ?limit=50 usa 50; si no se especifica, usa 20 por defecto)
    const limite = limiteParam ? parseInt(limiteParam, 10) : 20;
    query = query.limit(limite);

    const snapshot = await query.get();
    const canciones = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Obtener el total exacto de documentos en Firestore
    const totalSnapshot = await db.collection(COLECCION).count().get();
    const totalRegistros = totalSnapshot.data().count;

    return res.status(200).json({
      exito: true,
      tipo: "listado_general",
      total: canciones.length,
      totalRegistros,
      parametros: {
        limite,
        plataforma: plataformaParam || "todas",
      },
      data: canciones,
    });
  } catch (error: any) {
    return res.status(500).json({
      exito: false,
      mensaje: "Error en la Serverless Function",
      error: error.message,
    });
  }
}
