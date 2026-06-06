import type { ChangeEvent, SyntheticEvent } from "react";
import { TRACK_TYPES, TRACK_DATA } from './trackData';

// Normalise colour names from TRACK_DATA into hex values Mapbox understands
const COLOR_MAP: Record<string, string> = {
  'red':         '#e53e3e',
  'black':       '#1a1a1a',
  'blue':        '#2b6cb0',
  'green':       '#2ea160',
  'purple':      '#b12bbd',
  'grey':        '#a0a0a0',
  'light green': '#68d391',
};
const DEFAULT_COLOR = '#888888';

// Build a Mapbox match expression: ['match', ['get','type'], t1, c1, t2, c2, ..., default]
const typeColorMatchExpr: unknown[] = ['match', ['get', 'type']];
TRACK_DATA.forEach(r => {
  const hex = COLOR_MAP[r.color ?? ''] ?? DEFAULT_COLOR;
  typeColorMatchExpr.push(r.type, hex);
});
typeColorMatchExpr.push(DEFAULT_COLOR); // fallback
import { useEffect, useState, useCallback, useMemo } from "react";
import type { Schema } from "../amplify/data/resource";
import { checkLoginAndGetName } from "./utils/AuthUtils";
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from "aws-amplify/data";
import type { SelectionSet } from "aws-amplify/data";
import "@aws-amplify/ui-react/styles.css";
import { uploadData, remove } from "aws-amplify/storage";

import type { MapMouseEvent } from "mapbox-gl";


import 'mapbox-gl/dist/mapbox-gl.css';
//import { useGeoJSON } from './useGeoJSON';

import type { WaterFeatureProperties } from './types';
import './MapView.css';

//import { MapboxOverlay, MapboxOverlayProps } from "@deck.gl/mapbox/typed";
//import { PickingInfo } from "@deck.gl/core/typed";

import "maplibre-gl/dist/maplibre-gl.css";

import {
  Map,
  Source,
  Layer,
  //useControl,
  //Popup,
  Marker,
  NavigationControl,
  GeolocateControl,
  ScaleControl,
  Popup
} from "react-map-gl";



import "mapbox-gl/dist/mapbox-gl.css";


import {
  Input,
  Flex,
  Button,
  Table,
  TableBody,
  TableHead,
  TableCell,
  TableRow,
  ThemeProvider,
  Theme,
  Divider,
  Tabs,
  ScrollView,
  Radio,
  RadioGroupField,
  //CheckboxField,
  // TextField,
} from "@aws-amplify/ui-react";


//import { IconLayer } from "@deck.gl/layers/typed";


//import type { WaterFeatureProperties } from './types';
import './FeaturePopup.css';
const MAPBOX_TOKEN ="pk.eyJ1IjoicWlhb3hpbjEzNiIsImEiOiJjbGU1eXcyYTMwaHRyM29tc2dncjR6ZTBhIn0.8Wa3AEGbUSnau7PCEV3Stg" ;

const client = generateClient<Schema>();

const locationSelectionSet = [
  'id', 'date', 'time', 'track', 'type', 'diameter',
  'length', 'lat', 'lng', 'username', 'description',
  'photos', 'joint', 'createdAt', 'updatedAt',
] as const;
type LocationItem = SelectionSet<Schema['Location']['type'], typeof locationSelectionSet>;

const dateSelectionSet = [
  'id', 'date', 'weather', 'hight', 'lowt', 'supervisor',
  'labor', 'observation', 'remark', 'comment', 'equipment',
  'locationId', 'createdAt', 'updatedAt',
] as const;
type DateItem = SelectionSet<Schema['Date']['type'], typeof dateSelectionSet>;

const trackSelectionSet = [
  'id', 'track', 'type', 'geometry', 'quantity', 'unitprice', 'value', 'unit',
  'createdAt', 'updatedAt',
] as const;
type TrackItem = SelectionSet<Schema['Track']['type'], typeof trackSelectionSet>;


const theme: Theme = {
  name: "table-theme",
  tokens: {
    components: {
      table: {
        row: {
          hover: {
            backgroundColor: { value: "{colors.blue.20}" },
          },

          striped: {
            backgroundColor: { value: "{colors.orange.10}" },
          },
        },

        header: {
          color: { value: "{colors.blue.80}" },
          fontSize: { value: "{fontSizes.x3}" },
          borderColor: { value: "{colors.blue.20}" },
        },

        data: {
          fontWeight: { value: "{fontWeights.semibold}" },
        },
      },
    },
  },
};

// type DataT = {
//   type: "Feature";
//   id: number;
//   geometry: {
//     type: "Point";
//     coordinates: [number, number, number];
//   };
//   properties: {
//     track: number;
//     type: string;
//     status: string;
//     date: string;
//     time: string;
//     id: string;
//   };
// };




// Hong's addition
export type CustomEvent = {
  target: HTMLInputElement
}
// Hong's addition end

function TypeSelect({ value, onChange, style }: {
  value: string;
  onChange: (val: string) => void;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const geoColor = (type: string) => {
    const geo = TRACK_DATA.find(r => r.type === type)?.geometry;
    return geo === 'line' ? 'darkgreen' : geo === 'point' ? '#444444' : 'darkblue';
  };
  return (
    <div style={{ position: 'relative', ...style }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          fontSize: '12px', padding: '2px 4px', border: '1px solid #ccc',
          borderRadius: '3px', cursor: 'pointer', background: '#fff',
          color: geoColor(value), userSelect: 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontWeight: style?.fontWeight ?? 'normal',
        }}
      >
        <span>{value}</span>
        <span style={{ marginLeft: 4, color: '#333' }}>▾</span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', zIndex: 9999, background: '#fff',
          border: '1px solid #ccc', borderRadius: '3px',
          maxHeight: '220px', overflowY: 'auto', width: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          {TRACK_TYPES.map(t => (
            <div
              key={t}
              onClick={() => { onChange(t); setOpen(false); }}
              style={{
                fontSize: '12px', padding: '4px 6px', cursor: 'pointer',
                color: geoColor(t),
                background: t === value ? '#e8f0fe' : '#fff',
                fontWeight: style?.fontWeight ?? 'normal',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0f0f0')}
              onMouseLeave={e => (e.currentTarget.style.background = t === value ? '#e8f0fe' : '#fff')}
            >
              {t}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

//const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";
// "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";



interface PopupInfo {
  longitude: number;
  latitude: number;
  properties: WaterFeatureProperties;
}


function App() {

  const { signOut } = useAuthenticator();
  //const client = generateClient<Schema>();
  const [location, setLocation] = useState<LocationItem[]>([]);

  // Build a GeoJSON FeatureCollection directly from Amplify location state.
  // This replaces the external API URL (AIR_PORTS) which was returning
  // malformed JSON with invalid control characters, causing no points to render.
  const locationGeoJSON = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: location
      .filter(loc => loc.lat != null && loc.lng != null)
      .map(loc => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [loc.lng!, loc.lat!] },
        properties: {
          id:          loc.id,
          date:        loc.date ?? '',
          time:        loc.time ?? '',
          track:       loc.track ?? null,
          type:        loc.type ?? '',
          diameter:    loc.diameter ?? null,
          length:      loc.length ?? null,
          description: loc.description ?? '',
          joint:       loc.joint ?? null,
          color:       TRACK_DATA.find(r => r.type === loc.type)?.color ?? 'black',
        },
      })),
  }), [location]);

  const [jointMap, setJointMap] = useState<Record<string, string | null>>({});
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  //const [report, setReport] = useState("");
  const [track, setTrack] = useState<number>(0);
  const [type, setType] = useState<string>(TRACK_TYPES[0]);
  const [diameter, setDiameter] = useState<number>(0);
  const [length, setLength] = useState<number>(0);
  const [userName, setUserName] = useState<string>();
  const [description, setDescription] = useState<string>("");
  const [joint, setJoint] = useState<string>("joint");
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [placePhotos, setPlacePhotos] = useState<File[]>([]);

  const [tab, setTab] = useState("1");
  const [showExtraTabs, setShowExtraTabs] = useState(false);
  const [basemap, setBasemap] = useState("mapbox://styles/mapbox/streets-v12");
  const [pdfMode, setPdfMode] = useState(false);
  const [calResult, setCalResult] = useState<number | null>(null);

  //const [clickInfo, setClickInfo] = useState<DataT>();
  //const [showPopup, setShowPopup] = useState<boolean>(true);


  //const { data } = useGeoJSON();
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const [cursor, setCursor] = useState<string>('grab');
  const [editTrack, setEditTrack] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editDiameter, setEditDiameter] = useState<string>('');
  const [editType, setEditType] = useState<string>(TRACK_TYPES[0]);
  const [editJoint, setEditJoint] = useState<string>("joint");
  const [editDate, setEditDate] = useState<string>('');

  const [dateInfoList, setDateInfoList] = useState<DateItem[]>([]);
  const [diWeather, setDiWeather] = useState("");
  const [diHight, setDiHight] = useState<number | "">("");
  const [diLowt, setDiLowt] = useState<number | "">("");
  const [diSupervisor, setDiSupervisor] = useState("");
  const [diLabor, setDiLabor] = useState<number | "">("");
  const [diObservation, setDiObservation] = useState("");
  const [diRemark, setDiRemark] = useState("");
  const [diComment, setDiComment] = useState("");
  const [diEquipment, setDiEquipment] = useState("");

  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [editDateFields, setEditDateFields] = useState({
    date: "", weather: "", hight: "" as number | "", lowt: "" as number | "",
    supervisor: "", labor: "" as number | "", observation: "",
    remark: "", comment: "", equipment: "",
  });

  const [trackInfoList, setTrackInfoList] = useState<TrackItem[]>([]);
  const [trackChecked, setTrackChecked] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('trackChecked');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editTrackFields, setEditTrackFields] = useState({
    track: "", type: "", geometry: "" as "line" | "point" | "polygon" | "",
    quantity: "" as number | "", unitprice: "" as number | "", value: "" as number | "",
  });
  const [newTrackFields, setNewTrackFields] = useState({
    track: "", type: "", geometry: "" as "line" | "point" | "polygon" | "",
    quantity: "" as number | "", unitprice: "" as number | "", value: "" as number | "",
  });




  //console.log(AIR_PORTS);


  const handleDate = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    setDate(selected);
    if (selected && !dateInfoList.some(item => item.date === selected)) {
      client.models.Date.create({ date: selected });
    }
  };

  const handleTime = (e: ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
  };

  const handleTrack = (e: ChangeEvent<HTMLInputElement>) => {
    setTrack(parseInt(e.target.value));
  };


  const handleDiameter = (e: ChangeEvent<HTMLInputElement>) => {
    setDiameter(parseInt(e.target.value));
  }



  const handleUserName = async () => {
    const name = await checkLoginAndGetName();
    //console.log((name));
    if (name) {
      setUserName(name)
    }
  }

  const handleDescription = (e: ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  }

  useEffect(() => {
    // Exclude 'comments' (a.ref custom type) from the selection set.
    // When comments is included, observeQuery's internal findIndexByFields
    // crashes with "Cannot read properties of null (reading 'id')" whenever
    // a record is updated and comments is null.
    const sub = client.models.Location.observeQuery({
      selectionSet: [...locationSelectionSet],
    }).subscribe({
      next: (data) => setLocation([...data.items]),
      error: (err) => console.error('observeQuery error:', err),
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    const sub = client.models.Date.observeQuery({
      selectionSet: [...dateSelectionSet],
    }).subscribe({
      next: (data) => setDateInfoList([...data.items]),
      error: (err) => console.error('Date observeQuery error:', err),
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    const sub = client.models.Track.observeQuery({
      selectionSet: [...trackSelectionSet],
    }).subscribe({
      next: (data) => {
        setTrackInfoList([...data.items]);
        setTrackChecked(prev => {
          const next = { ...prev };
          data.items.forEach(item => { if (!(item.id in next)) next[item.id] = true; });
          return next;
        });
      },
      error: (err) => console.error('Track observeQuery error:', err),
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    try { localStorage.setItem('trackChecked', JSON.stringify(trackChecked)); } catch {}
  }, [trackChecked]);

  // Build jointMap directly from Amplify location state (no external fetch needed).
  useEffect(() => {
    const map: Record<string, string | null> = {};
    location.forEach(loc => { map[loc.id] = loc.joint ?? null; });
    setJointMap(map);
  }, [location]);

  useEffect(() => {
    handleUserName();
  }, []);



  function createLocation() {
    if (!date) {
      alert("Please select a date before adding a new record.");
      return;
    }

    handleUserName();
    const name = userName;
    client.models.Location.create({
      date: date,
      time: time,
      track: track,
      type: type,
      diameter: diameter,
      length: calResult !== null ? calResult : length,
      username: name,
      description: description,
      lat: lat,
      lng: lng,
      joint: joint,
      color: TRACK_DATA.find(r => r.type === type)?.color ?? 'black',
    });

    const trackStr = String(track);
    const alreadyExists = trackInfoList.some(t => t.track === trackStr);
    if (!alreadyExists) {
      const csvRow = TRACK_DATA.find(r => r.type === type);
      client.models.Track.create({
        track: trackStr,
        type: type,
        geometry: csvRow?.geometry ?? undefined,
        unitprice: csvRow?.unitprice ?? undefined,
      });
    }

    setDate("");
    setTime("");
    setTrack(track);
    setType(type);
    setDiameter(diameter);
    setUserName("");
    setDescription("");
    setLat(0);
    setLng(0);
  }

  async function deleteLocation2(id: string, photourls: (string | null)[]):
    Promise<{
      response: number
      info: string
    }> {
    console.log('called delete location ')
    console.log("id=", id)
    console.log("photourl=", photourls)

    photourls.forEach(
      async (aPath) => {
        if (aPath)
          try {
            await remove({ path: aPath })
          } catch (error) {
            console.error('Error deleting photoes:', error);
            return { response: 299, info: 'failed' }
          }
      }
    )


    client.models.Location.delete({ id })

    return { response: 200, info: 'success' };
    /*
    const result = await deleteLocationPhotos(id)
    if (result.response == 200 ) {
      client.models.Location.delete({ id })
    }else {
      console.log(" error to delete photos ")
    }*/
  }

  async function deleteLocation(id: string) {
    const result = await deleteLocationPhotos(id)
    console.log("result =", result.response)
    if (result.response == 200) {
      client.models.Location.delete({ id })
    } else {
      console.log(" error to delete photos ")
    }
  }





  async function handleSubmit(event: SyntheticEvent, id: string) {
    event.preventDefault();

    let placePhotosUrls: string[] = [];
    console.log("before submit, photoes size ", placePhotos.length);
    const uploadResult = await uploadPhotos(placePhotos, id);
    placePhotosUrls = uploadResult.urls;

    const currentLoc = await client.models.Location.get({ id });

    let revised: string[] = [];
    if (currentLoc.data?.photos) {
      currentLoc.data.photos.forEach(d => { if (d) revised.push(d); });
    }

    await client.models.Location.update({
      id: id,
      photos: [...placePhotosUrls, ...revised]
    });

    clearFields();
  }

  function clearFields() {
    //setuserName('');
    setPlacePhotos([]);
  }

  async function uploadPhotos(files: File[], id: string): Promise<{
    urls: string[]

  }> {
    const urls: string[] = [];
    console.log('start to upload photos')
    console.log('# of files', files.length)

    for (const file of files) {
      console.log(`uploading file ${file.name}`)
      const result = await uploadData({
        data: file,
        path: `originals/${id}/${file.name}`
      }).result
      urls.push(result.path);
      console.log('url is ', urls);

    }
    return {
      urls,

    };
  }

  //Hong's addition
  function previewPhotos(event: CustomEvent) {

    if (event.target.files) {
      const eventPhotos = Array.from(event.target.files);
      //const newFiles: File[] = [...new Set([...eventPhotos, ...placePhotos])]
      //console.log("newFiles =", newFiles)
      //setPlacePhotos(newFiles);
      setPlacePhotos(eventPhotos)
    }
  }

  async function deleteLocationPhotos(locId: string): Promise<{
    response: number
    info: string
  }> {
    console.log("Loc Id = " + locId)
    if (location) {
      try {

        await remove({ path: `originals/${locId}` })
      } catch (error) {
        console.error('Error deleting photoes:', error);
        return { response: 299, info: 'failed' }
      }
    }
    return { response: 200, info: 'success' };
  }

  //end Hong's addition

  async function handleUpdatePopup(id: string) {
    // Use raw GraphQL to bypass the Amplify Gen 2 client-side field-validation
    // bug triggered by the `comments: a.ref('Comment').array()` custom type.
    const mutation = /* GraphQL */ `
      mutation UpdateLocation($input: UpdateLocationInput!) {
        updateLocation(input: $input) {
          id
          date
          track
          type
          diameter
          description
          joint
        }
      }
    `;
    try {
      const input: Record<string, unknown> = { id };
      input.date        = editDate;
      input.type        = editType;
      input.description = editDescription;
      input.joint       = editJoint;
      const parsedTrack    = parseInt(editTrack);
      const parsedDiameter = parseFloat(editDiameter);
      if (editTrack    !== '' && !isNaN(parsedTrack))    input.track    = parsedTrack;
      if (editDiameter !== '' && !isNaN(parsedDiameter)) input.diameter = parsedDiameter;

      console.log('Updating via GraphQL:', input);
      const result = await (client as any).graphql({ query: mutation, variables: { input } });
      console.log('Update result:', result);

      // Manually patch local state so the UI reflects the change immediately,
      // independent of the observeQuery subscription which can crash on custom types.
      const { data: fresh } = await client.models.Location.get({ id });
      if (fresh) {
        setLocation(prev => prev.map(loc => loc.id === id ? fresh : loc));
      }
      setPopupInfo(null);
    } catch (err) {
      console.error('Update exception:', err);
      alert('Save failed: ' + String(err));
    }
  }

  function haversineDistanceFt(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 20902464; // Earth radius in feet
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function createDateInfo() {
    if (!date) return;
    if (dateInfoList.some(item => item.date === date)) {
      alert(`A record for ${date} already exists.`);
      return;
    }
    client.models.Date.create({
      date,
      weather: diWeather || undefined,
      hight: diHight !== "" ? Number(diHight) : undefined,
      lowt: diLowt !== "" ? Number(diLowt) : undefined,
      supervisor: diSupervisor || undefined,
      labor: diLabor !== "" ? Number(diLabor) : undefined,
      observation: diObservation || undefined,
      remark: diRemark || undefined,
      comment: diComment || undefined,
      equipment: diEquipment || undefined,
    });
    setDiWeather("");
    setDiHight("");
    setDiLowt("");
    setDiSupervisor("");
    setDiLabor("");
    setDiObservation("");
    setDiRemark("");
    setDiComment("");
    setDiEquipment("");
  }

  function saveDateInfo(id: string) {
    client.models.Date.update({
      id,
      date: editDateFields.date || undefined,
      weather: editDateFields.weather || undefined,
      hight: editDateFields.hight !== "" ? Number(editDateFields.hight) : undefined,
      lowt: editDateFields.lowt !== "" ? Number(editDateFields.lowt) : undefined,
      supervisor: editDateFields.supervisor || undefined,
      labor: editDateFields.labor !== "" ? Number(editDateFields.labor) : undefined,
      observation: editDateFields.observation || undefined,
      remark: editDateFields.remark || undefined,
      comment: editDateFields.comment || undefined,
      equipment: editDateFields.equipment || undefined,
    });
    setEditingDateId(null);
  }

  async function handleClean() {
    // 1. Delete Date Info rows whose date doesn't appear in any Location record
    const locationDates = new Set(location.map(loc => loc.date));
    for (const item of dateInfoList) {
      if (item.date && !locationDates.has(item.date)) {
        await client.models.Date.delete({ id: item.id });
      }
    }

    // 2. Delete Track Info rows whose track number doesn't appear in any Location record
    const locationTracks = new Set(location.map(loc => String(loc.track)));
    for (const item of trackInfoList) {
      if (item.track && !locationTracks.has(item.track)) {
        await client.models.Track.delete({ id: item.id });
      }
    }
  }

  async function handleExportPolygon() {
    const polygonTracks = trackInfoList.filter(t => t.geometry === 'polygon');

    const features = polygonTracks.map(trackItem => {
      const trackNum = parseInt(trackItem.track ?? '');
      const locs = location
        .filter(loc => loc.track === trackNum && loc.lat != null && loc.lng != null)
        .sort((a, b) => {
          const da = `${a.date ?? ''}T${a.time ?? ''}`;
          const db = `${b.date ?? ''}T${b.time ?? ''}`;
          return da.localeCompare(db);
        });

      const coords: [number, number][] = locs.map(loc => [loc.lng!, loc.lat!]);
      if (coords.length > 0) coords.push(coords[0]); // close the ring

      return {
        type: 'Feature' as const,
        properties: {
          track: trackItem.track,
          type: trackItem.type,
          quantity: trackItem.quantity,
          unitprice: trackItem.unitprice,
          value: trackItem.value,
          color: TRACK_DATA.find(r => r.type === trackItem.type)?.color ?? 'black',
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [coords],
        },
      };
    });

    const geojson = { type: 'FeatureCollection' as const, features };
    const content = JSON.stringify(geojson, null, 2);
    const blob = new Blob([content], { type: 'application/geo+json' });

    // Upload to S3 storage
    try {
      await uploadData({ path: 'originals/polygon.geojson', data: blob }).result;
      console.log('polygon.geojson uploaded to S3');
    } catch (err) {
      console.error('S3 upload failed:', err);
    }

    // Download to local machine (saves to browser Downloads folder as polygon.geojson)
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'polygon.geojson';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function polygonAreaSqYd(points: { lat: number; lng: number }[]): number {
    if (points.length < 3) return 0;
    const avgLatRad = points.reduce((s, p) => s + p.lat, 0) / points.length * Math.PI / 180;
    const mPerDegLat = 111139;
    const mPerDegLng = 111139 * Math.cos(avgLatRad);
    let area = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += (points[i].lng * mPerDegLng) * (points[j].lat * mPerDegLat)
            - (points[j].lng * mPerDegLng) * (points[i].lat * mPerDegLat);
    }
    return Math.abs(area) / 2 * 1.19599;
  }

  async function handleFillTrack() {
    for (const trackItem of trackInfoList) {
      if (!trackChecked[trackItem.id]) continue;

      const trackNum = parseInt(trackItem.track ?? '');
      if (isNaN(trackNum)) continue;

      const csvRow = TRACK_DATA.find(r => r.type === trackItem.type);
      const geometry = csvRow?.geometry ?? trackItem.geometry;
      const locs = location.filter(loc => loc.track === trackNum);

      let quantity = 0;
      if (geometry === 'point') {
        quantity = locs.length;
      } else if (geometry === 'line') {
        quantity = locs.reduce((sum, loc) => sum + (loc.length ?? 0), 0);
      } else if (geometry === 'polygon') {
        const pts = locs
          .filter(loc => loc.lat != null && loc.lng != null)
          .map(loc => ({ lat: loc.lat!, lng: loc.lng! }));
        quantity = polygonAreaSqYd(pts);
      }

      const value = trackItem.unitprice != null ? trackItem.unitprice * quantity : undefined;
      await client.models.Track.update({
        id: trackItem.id,
        type: trackItem.type ?? undefined,
        geometry: (geometry ?? undefined) as "line" | "point" | "polygon" | undefined,
        quantity,
        ...(value !== undefined ? { value } : {}),
      });
    }
  }

  function handleCal() {
    const sameTrack = location.filter(loc => loc.track === track);
    if (sameTrack.length === 0) {
      setCalResult(0);
      return;
    }

    // Find the point with the latest combined date+time on the same track
    let latest: LocationItem | null = null;
    let latestDT = "";
    for (const loc of sameTrack) {
      const dt = (loc.date ?? "") + "T" + (loc.time ?? "");
      if (dt > latestDT) {
        latestDT = dt;
        latest = loc;
      }
    }

    if (!latest || latest.lat == null || latest.lng == null) {
      setLength(0);
      setCalResult(0);
      return;
    }

    setCalResult(haversineDistanceFt(lat, lng, latest.lat, latest.lng));
  }

  function createTrackInfo() {
    const f = newTrackFields;
    client.models.Track.create({
      track: f.track || undefined,
      type: f.type || undefined,
      geometry: (f.geometry || undefined) as "line" | "point" | "polygon" | undefined,
      quantity: f.quantity !== "" ? Number(f.quantity) : undefined,
      unitprice: f.unitprice !== "" ? Number(f.unitprice) : undefined,
      value: f.value !== "" ? Number(f.value) : undefined,
    });
    setNewTrackFields({ track: "", type: "", geometry: "", quantity: "", unitprice: "", value: "" });
  }

  function saveTrackInfo(id: string) {
    const f = editTrackFields;
    client.models.Track.update({
      id,
      track: f.track || undefined,
      type: f.type || undefined,
      geometry: (f.geometry || undefined) as "line" | "point" | "polygon" | undefined,
      quantity: f.quantity !== "" ? Number(f.quantity) : undefined,
      unitprice: f.unitprice !== "" ? Number(f.unitprice) : undefined,
      value: f.value !== "" ? Number(f.value) : undefined,
    });
    setEditingTrackId(null);
  }

  const onClick = useCallback((e: MapMouseEvent) => {
    const feature = e.features?.[0];

    //console.log("clicked feature =", feature);
    if (feature?.layer?.id === 'lines' && pdfMode) {
      const dn = feature.properties?.DN;
      if (dn != null) {
        window.open(`https://bcwws-reuse.s3.us-east-1.amazonaws.com/FM${dn}.pdf`, '_blank');
      }
      return;
    }

    if (!feature || feature.geometry.type !== 'Point') {
      //console.log(e);
      setLat(e.lngLat.lat);
      setLng(e.lngLat.lng);
      setPopupInfo(null);
    }
    else {

      const [lng, lat] = feature.geometry.coordinates;
      const props = feature.properties as WaterFeatureProperties;
      const match = location.find(loc => loc.id === props.id);
      setPopupInfo({
        longitude: lng,
        latitude: lat,
        properties: { ...props, joint: match?.joint ?? null },
      });
      setEditTrack(props.track != null ? String(props.track) : '');
      setEditDescription(props.description ?? '');
      setEditDiameter(props.diameter != null ? String(props.diameter) : '');
      setEditType(props.type ?? 'reuse');
      setEditJoint(typeof match?.joint === 'string' ? match.joint : 'joint');
      setEditDate(match?.date ?? props.date ?? '');
    };
  }, [location, pdfMode]);

  const onMouseEnter = useCallback(() => setCursor('pointer'), []);
  const onMouseLeave = useCallback(() => setCursor('grab'), []);

  const change_basemap = (value: string) => {
    if (value === "light") {
      setBasemap("mapbox://styles/mapbox/light-v11")
    } else if (value === "street") {
      setBasemap("mapbox://styles/mapbox/streets-v12")
    } else if (value === "satellite") {
      setBasemap("mapbox://styles/mapbox/satellite-streets-v12")
    }
  };

  return (
    <main>
      <h1>BCWWS REGIONAL EFFLUENT AND REUSE SOLUTIONS - EFFLUENT WATER TRANSMISSION MAIN</h1>
      <Divider orientation="horizontal" />
      <br />
      <Flex>
        <Button onClick={signOut} width={120}>
          Sign out
        </Button>
        <Button onClick={createLocation} backgroundColor={"azure"} color={"red"}>
          + New
        </Button>
        <Button onClick={handleCal} backgroundColor={"lightyellow"} color={"darkblue"}>
          QC
        </Button>
        <Button onClick={handleFillTrack} backgroundColor={"lightgreen"} color={"darkgreen"}>
          Computation
        </Button>
        <Button onClick={handleExportPolygon} backgroundColor={"lightyellow"} color={"darkorange"}>
          Complete Polygon
        </Button>
        <Button onClick={handleClean} backgroundColor={"#ffe4e1"} color={"#c0392b"}>
          Clean
        </Button>
        <Button
          onClick={() => {
            setShowExtraTabs(prev => {
              if (!prev && (tab === "2" || tab === "4")) setTab("1");
              return !prev;
            });
          }}
          backgroundColor={showExtraTabs ? "#d1ecf1" : "#f8f9fa"}
          color={showExtraTabs ? "#0c5460" : "#6c757d"}
        >
          {showExtraTabs ? "Tab ▲" : "Tab ▼"}
        </Button>
        {calResult !== null && (
          <span style={{ alignSelf: "center", fontWeight: "bold" }}>
            Distance: {calResult.toFixed(1)} ft
          </span>
        )}
      </Flex>
      <br />
      <Flex direction="row">

        <input
          type="date"
          value={date}
          placeholder="date"
          onChange={handleDate}
        //width="150%"
        />
        <input
          type="time"
          value={time}
          placeholder="time"
          onChange={handleTime}
        //width="150%"
        />
        <input
          type="number"
          value={track}
          placeholder="track"
          onChange={handleTrack}
          style={{ width: '70px' }}
        />
        <TypeSelect
          value={type}
          onChange={setType}
          style={{ width: '320px', fontWeight: 'bold' }}
        />


        <input
          type="number"
          value={diameter}
          placeholder="diameter (in)"
          onChange={handleDiameter}
          style={{ width: '100px' }}
        />
  
        <Input
          type="text"
          value={description}
          placeholder="description"
          onChange={handleDescription}
          width="700px"
        />
        <select
          value={joint}
          onChange={e => setJoint(e.target.value)}
        >
          <option value="joint">Joint</option>
          <option value="90-bend">90-Bend</option>
          <option value="45-bend">45-Bend</option>
          <option value="22.5-bend">22.5-Bend</option>
          <option value="11.25-bend">11.25-Bend</option>
          <option value="24-plug-valve">24-Plug Valve</option>
          <option value="30-plug-valve">30-Plug Valve</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={pdfMode}
            onChange={e => setPdfMode(e.target.checked)}
          />
          {pdfMode ? 'PDF Mode' : 'Marker Mode'}
        </label>
        {/* <Input type="number" value={Number(lat.toFixed(10))} />
        <Input type="number" value={Number(lng.toFixed(10))} /> */}
      </Flex>
      <Divider orientation="horizontal" />
      <br />
      <Tabs
        value={tab}
        onValueChange={(tab) => setTab(tab)}
        items={[
          {
            label: "Progress Map",
            value: "1",
            content: (<>
              <Map
                initialViewState={{
                  longitude: -80.13289123074017,
                  latitude: 26.260443058928075,
                  zoom: 16,
                }}
                mapboxAccessToken={MAPBOX_TOKEN}
                //mapLib={maplibregl}
                mapStyle={basemap} // Use any MapLibre-compatible style

                style={{
                  width: "100%",
                  height: "1000px",
                  borderColor: "#000000",
                }}
                interactiveLayerIds={['water-points', 'lines']}
                onClick={onClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                cursor={cursor}
              >
                <Source id="water-data" type="geojson" data={locationGeoJSON}>

                  <Layer
                    id='water-points'
                    type='circle'
                    source='water-data'
                    paint={{
                      'circle-radius': [
                        'case',
                        ['all', ['any', ['==', ['get', 'type'], 'wastewater'], ['==', ['get', 'type'], 'stormwater']], ['==', ['get', 'joint'], false]],
                        5,
                        ['all', ['any', ['==', ['get', 'type'], 'wastewater'], ['==', ['get', 'type'], 'stormwater']], ['==', ['get', 'joint'], true]],
                        3.5,
                        3.5
                      ],
                      'circle-color': typeColorMatchExpr as any,
                      'circle-stroke-color': '#ffffff',
                      'circle-stroke-width': 2,
                      'circle-opacity': 0.9,
                    }}
                  />
                </Source>

                <Source id="lines" type="vector" url="mapbox://qiaoxin136.6712mnvq">
                  <Layer
                    id='lines'
                    type='line'
                    source='lines'
                    source-layer="line-34gbbu"
                    paint={{
                      'line-width': 1,
                      // Use a get expression (https://docs.mapbox.comhttps://docs.mapbox.com/style-spec/reference/expressions/#get)
                      // to set the line-color to a feature property value.
                      'line-color': "#c7a0ca",
                      'line-dasharray': [4, 2]
                    }}
                  />
                </Source>
                <Source id="tick" type="vector" url="mapbox://qiaoxin136.pt7om4">
                  <Layer
                    id='tick'
                    type='line'
                    source='tick'
                    source-layer="tick.zip-77tjih"
                    paint={{
                      'line-width': 1,
                      // Use a get expression (https://docs.mapbox.comhttps://docs.mapbox.com/style-spec/reference/expressions/#get)
                      // to set the line-color to a feature property value.
                      'line-color': "#959796",
                      'line-dasharray': [4, 2]
                    }}
                  />
                </Source>

                <Source id="station" type="geojson" data="/station.geojson">
                  <Layer
                    id="station-points"
                    type="circle"
                    source="station"
                    paint={{
                      'circle-radius': 1,
                      'circle-color': '#e85d04',
                    }}
                  />
                  <Layer
                    id="station-labels"
                    type="symbol"
                    source="station"
                    layout={{
                      'text-field': ['get', 'Text'],
                      'text-size': 10,
                      'text-offset': [0, 1],
                      'text-anchor': 'top',
                    }}
                    paint={{
                      'text-color': '#000000',
                      'text-halo-color': '#ffffff',
                      'text-halo-width': 1,
                    }}
                  />
                </Source>

                <Marker latitude={Number(lat)} longitude={Number(lng)} />
                {popupInfo && (
                  <>
                    <Popup
                      longitude={popupInfo.longitude}
                      latitude={popupInfo.latitude}
                      anchor="bottom"
                      offset={12}
                      onClose={() => setPopupInfo(null)}
                      closeOnClick={false}
                    >
                      <div className="popup">
                        <h3 className="popup-title">
                          <span className="popup-type-badge">{popupInfo.properties.type}</span>
                          Water Infrastructure
                        </h3>
                        <table className="popup-table">
                          <tbody>
                            <tr>
                              <td>Date</td>
                              <td>
                                <input
                                  aria-label="Date"
                                  type="date"
                                  value={editDate}
                                  onChange={e => setEditDate(e.target.value)}
                                  style={{ fontSize: '12px', padding: '2px 4px', width: '100%' }}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>Type</td>
                              <td>
                                <TypeSelect
                                  value={editType}
                                  onChange={setEditType}
                                  style={{ width: '100%' }}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>Track</td>
                              <td>
                                <input
                                  aria-label="Track"
                                  type="number"
                                  value={editTrack}
                                  onChange={e => setEditTrack(e.target.value)}
                                  style={{ fontSize: '12px', padding: '2px 4px', width: '100%' }}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>Diameter</td>
                              <td>
                                <input
                                  aria-label="Diameter"
                                  type="number"
                                  value={editDiameter}
                                  onChange={e => setEditDiameter(e.target.value)}
                                  style={{ fontSize: '12px', padding: '2px 4px', width: '100%' }}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>Description</td>
                              <td>
                                <input
                                  aria-label="Description"
                                  type="text"
                                  value={editDescription}
                                  onChange={e => setEditDescription(e.target.value)}
                                  style={{ fontSize: '12px', padding: '2px 4px', width: '100%' }}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>Joint</td>
                              <td>
                                <select
                                  value={editJoint}
                                  onChange={e => setEditJoint(e.target.value)}
                                  style={{ fontSize: '12px', padding: '2px 4px' }}
                                >
                                  <option value="joint">Joint</option>
                                  <option value="90-bend">90-Bend</option>
                                  <option value="45-bend">45-Bend</option>
                                  <option value="22.5-bend">22.5-Bend</option>
                                  <option value="11.25-bend">11.25-Bend</option>
                                  <option value="24-plug-valve">24-Plug Valve</option>
                                  <option value="30-plug-valve">30-Plug Valve</option>
                                </select>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleUpdatePopup(popupInfo.properties.id); }}
                          style={{
                            fontSize: '12px', padding: '2px 8px', cursor: 'pointer',
                            border: '1px solid #2b6cb0', borderRadius: '3px',
                            background: '#fff', color: '#2b6cb0',
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            deleteLocation(popupInfo.properties.id);
                            setPopupInfo(null);
                          }}
                          style={{
                            fontSize: '12px', padding: '2px 8px', cursor: 'pointer',
                            border: '1px solid #c00', borderRadius: '3px',
                            background: '#fff', color: '#c00',
                          }}
                        >
                          Delete
                        </button>
                        </div>
                        <br /><br />
                        <label style={{ fontSize: '12px' }}>Place photos:</label><br />
                        <input type="file" multiple
                          onChange={(e) => previewPhotos(e)}
                          placeholder="new picture"
                          style={{ fontSize: '12px' }}
                        /><br /><br />
                        <button
                          onClick={(e) => {
                            console.log(popupInfo.properties);
                            handleSubmit(e, popupInfo.properties.id);
                            setPopupInfo(null);
                          }}
                          style={{
                            fontSize: '12px', padding: '2px 8px', cursor: 'pointer',
                            border: '1px solid #555', borderRadius: '3px',
                            background: '#fff', color: '#333',
                          }}
                        >
                          Upload
                        </button>
                        <br /><br />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleUpdatePopup(popupInfo.properties.id); }}
                          style={{
                            fontSize: '12px', padding: '4px 16px', cursor: 'pointer',
                            border: '1px solid #2b6cb0', borderRadius: '4px',
                            background: '#2b6cb0', color: '#fff', fontWeight: 600,
                            width: '100%',
                          }}
                        >
                          Apply
                        </button>
                      </div>
                    </Popup>

                  </>

                )}
                <NavigationControl position="top-right" />
                <ScaleControl position="bottom-right" unit='imperial' maxWidth={500} />
                <GeolocateControl position="top-right" positionOptions={{ enableHighAccuracy: true }}
                  trackUserLocation={true}
                  // Draw an arrow next to the location dot to indicate which direction the device is heading.
                  showUserHeading={true} />
                <RadioGroupField legend="Row" name="row" direction="row" onChange={(e) => change_basemap(e.target.value)} defaultValue="street">
                  <Radio value="light" >Light</Radio>
                  <Radio value="street">Street</Radio>
                  <Radio value="satellite">Satellite</Radio>
                </RadioGroupField>
                <div style={{
                  position: 'absolute',
                  bottom: '40px',
                  left: '10px',
                  background: 'rgba(255,255,255,0.92)',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  boxShadow: '0 1px 5px rgba(0,0,0,0.25)',
                  fontSize: '12px',
                  lineHeight: '1',
                  zIndex: 1,
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '8px', fontSize: '12px' }}>Legend</div>
                  {([
                    { label: 'Reuse',       color: '#b12bbd' },
                    { label: 'Water',       color: '#2b6cb0' },
                    { label: 'Wastewater',  color: '#2ea160' },
                    { label: 'Stormwater',  color: '#eca4a4' },
                    { label: 'Pavement',    color: '#a0a0a0' },
                  ] as { label: string; color: string }[]).map(({ label, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        width: '12px', height: '12px', borderRadius: '50%',
                        background: color, border: '2px solid #fff',
                        boxShadow: '0 0 0 1px rgba(0,0,0,0.2)',
                        flexShrink: 0,
                      }} />
                      {label}
                    </div>
                  ))}
                </div>
              </Map>
            </>)
          },
          {
            label: "Report Input",
            value: "3",
            content: (<>
              <ScrollView
                as="div"
                ariaLabel="Report Input"
                backgroundColor="var(--amplify-colors-white)"
                borderRadius="6px"
                color="var(--amplify-colors-blue-60)"
                padding="1rem"
                height="700px"
              >
                <ThemeProvider theme={theme} colorMode="light">
                  <Table caption="" highlightOnHover={false} variation="striped"
                    style={{ width: '100%', fontFamily: 'Arial, sans-serif' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell as="th">Date</TableCell>
                        <TableCell as="th">Weather</TableCell>
                        <TableCell as="th">High Temp</TableCell>
                        <TableCell as="th">Low Temp</TableCell>
                        <TableCell as="th">Supervisor</TableCell>
                        <TableCell as="th">Labor</TableCell>
                        <TableCell as="th">Observation</TableCell>
                        <TableCell as="th">Remark</TableCell>
                        <TableCell as="th">Comment</TableCell>
                        <TableCell as="th">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            Equipment
                            <select
                              defaultValue=""
                              onChange={e => {
                                if (e.target.value) {
                                  setDiEquipment(prev => prev ? `${prev}, ${e.target.value}` : e.target.value);
                                  e.target.value = "";
                                }
                              }}
                              style={{ fontSize: '11px', padding: '1px 3px' }}
                            >
                              <option value="">+ List</option>
                              <option>Loader</option>
                              <option>Excavator</option>
                              <option>Bobcat</option>
                              <option>Broom Tractor</option>
                              <option>Combination</option>
                              <option>Vibratory Roller</option>
                              <option>Pneumatic Roller</option>
                              <option>Grader</option>
                              <option>Mini Grader</option>
                              <option>Asphalt / Dump Truck</option>
                              <option>Milling Machine</option>
                              <option>Asphalt Paver</option>
                              <option>HDD Machine</option>
                              <option>Trencher</option>
                              <option>Crane</option>
                              <option>Sled Tamp</option>
                              <option>Dozer</option>
                            </select>
                            <button
                              onClick={() => setDate(new Date().toISOString().split('T')[0])}
                              style={{ fontSize: '11px', padding: '1px 6px', cursor: 'pointer', whiteSpace: 'nowrap', backgroundColor: '#2b6cb0', color: 'white', border: 'none', borderRadius: '3px' }}
                            >
                              Clear
                            </button>
                          </div>
                        </TableCell>
                        <TableCell as="th"></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <input type="date" value={date} readOnly style={{ width: '100%' }} />
                        </TableCell>
                        <TableCell>
                          <input type="text" value={diWeather} placeholder="weather"
                            onChange={e => setDiWeather(e.target.value)} style={{ width: '100%' }} />
                        </TableCell>
                        <TableCell>
                          <input type="number" value={diHight} placeholder="high"
                            onChange={e => setDiHight(e.target.value === "" ? "" : Number(e.target.value))} style={{ width: '100%' }} />
                        </TableCell>
                        <TableCell>
                          <input type="number" value={diLowt} placeholder="low"
                            onChange={e => setDiLowt(e.target.value === "" ? "" : Number(e.target.value))} style={{ width: '100%' }} />
                        </TableCell>
                        <TableCell>
                          <input type="text" value={diSupervisor} placeholder="supervisor"
                            onChange={e => setDiSupervisor(e.target.value)} style={{ width: '100%' }} />
                        </TableCell>
                        <TableCell>
                          <input type="number" value={diLabor} placeholder="labor"
                            onChange={e => setDiLabor(e.target.value === "" ? "" : Number(e.target.value))} style={{ width: '100%' }} />
                        </TableCell>
                        <TableCell>
                          <input type="text" value={diObservation} placeholder="observation"
                            onChange={e => setDiObservation(e.target.value)} style={{ width: '100%' }} />
                        </TableCell>
                        <TableCell>
                          <input type="text" value={diRemark} placeholder="remark"
                            onChange={e => setDiRemark(e.target.value)} style={{ width: '100%' }} />
                        </TableCell>
                        <TableCell>
                          <input type="text" value={diComment} placeholder="comment"
                            onChange={e => setDiComment(e.target.value)} style={{ width: '100%' }} />
                        </TableCell>
                        <TableCell>
                          <input type="text" value={diEquipment} placeholder="equipment"
                            onChange={e => setDiEquipment(e.target.value)} style={{ width: '100%' }} />
                        </TableCell>
                        <TableCell>
                          <button onClick={createDateInfo} disabled={!date} style={{ backgroundColor: 'green', color: 'white', border: 'none', padding: '4px 10px', cursor: 'pointer' }}>Add</button>
                        </TableCell>
                      </TableRow>
                      {[...dateInfoList].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')).map(item => {
                        const isEditing = editingDateId === item.id;
                        const ef = editDateFields;
                        const setEf = (field: keyof typeof editDateFields, val: string | number | "") =>
                          setEditDateFields(prev => ({ ...prev, [field]: val }));
                        return isEditing ? (
                          <TableRow key={item.id}>
                            <TableCell>
                              <input type="date" value={ef.date}
                                onChange={e => setEf('date', e.target.value)} style={{ width: '100%' }} />
                            </TableCell>
                            <TableCell>
                              <input type="text" value={ef.weather}
                                onChange={e => setEf('weather', e.target.value)} style={{ width: '100%' }} />
                            </TableCell>
                            <TableCell>
                              <input type="number" value={ef.hight}
                                onChange={e => setEf('hight', e.target.value === "" ? "" : Number(e.target.value))} style={{ width: '100%' }} />
                            </TableCell>
                            <TableCell>
                              <input type="number" value={ef.lowt}
                                onChange={e => setEf('lowt', e.target.value === "" ? "" : Number(e.target.value))} style={{ width: '100%' }} />
                            </TableCell>
                            <TableCell>
                              <input type="text" value={ef.supervisor}
                                onChange={e => setEf('supervisor', e.target.value)} style={{ width: '100%' }} />
                            </TableCell>
                            <TableCell>
                              <input type="number" value={ef.labor}
                                onChange={e => setEf('labor', e.target.value === "" ? "" : Number(e.target.value))} style={{ width: '100%' }} />
                            </TableCell>
                            <TableCell>
                              <input type="text" value={ef.observation}
                                onChange={e => setEf('observation', e.target.value)} style={{ width: '100%' }} />
                            </TableCell>
                            <TableCell>
                              <input type="text" value={ef.remark}
                                onChange={e => setEf('remark', e.target.value)} style={{ width: '100%' }} />
                            </TableCell>
                            <TableCell>
                              <input type="text" value={ef.comment}
                                onChange={e => setEf('comment', e.target.value)} style={{ width: '100%' }} />
                            </TableCell>
                            <TableCell>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input type="text" value={ef.equipment}
                                  onChange={e => setEf('equipment', e.target.value)} style={{ flex: 1 }} />
                                <select
                                  defaultValue=""
                                  onChange={e => {
                                    if (e.target.value) {
                                      setEf('equipment', ef.equipment ? `${ef.equipment}, ${e.target.value}` : e.target.value);
                                      e.target.value = "";
                                    }
                                  }}
                                  style={{ fontSize: '11px', padding: '1px 3px' }}
                                >
                                  <option value="">+ List</option>
                                  <option>Loader</option>
                                  <option>Excavator</option>
                                  <option>Bobcat</option>
                                  <option>Broom Tractor</option>
                                  <option>Combination</option>
                                  <option>Vibratory Roller</option>
                                  <option>Pneumatic Roller</option>
                                  <option>Grader</option>
                                  <option>Mini Grader</option>
                                  <option>Asphalt / Dump Truck</option>
                                  <option>Milling Machine</option>
                                  <option>Asphalt Paver</option>
                                  <option>HDD Machine</option>
                                  <option>Trencher</option>
                                  <option>Crane</option>
                                  <option>Sled Tamp</option>
                                  <option>Dozer</option>
                                </select>
                                <button
                                  onClick={() => setEf('equipment', '')}
                                  style={{ fontSize: '11px', padding: '1px 6px', cursor: 'pointer', whiteSpace: 'nowrap', backgroundColor: '#2b6cb0', color: 'white', border: 'none', borderRadius: '3px' }}
                                >
                                  Clear
                                </button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <button onClick={() => saveDateInfo(item.id)} style={{ marginRight: 4, backgroundColor: 'green', color: 'white', border: 'none', padding: '4px 10px', cursor: 'pointer' }}>Save</button>
                              <button onClick={() => setEditingDateId(null)} style={{ backgroundColor: 'red', color: 'white', border: 'none', padding: '4px 10px', cursor: 'pointer' }}>Cancel</button>
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow key={item.id}>
                            <TableCell>{item.date}</TableCell>
                            <TableCell>{item.weather}</TableCell>
                            <TableCell>{item.hight}</TableCell>
                            <TableCell>{item.lowt}</TableCell>
                            <TableCell>{item.supervisor}</TableCell>
                            <TableCell>{item.labor}</TableCell>
                            <TableCell>{item.observation}</TableCell>
                            <TableCell>{item.remark}</TableCell>
                            <TableCell>{item.comment}</TableCell>
                            <TableCell>{item.equipment}</TableCell>
                            <TableCell>
                              <button onClick={() => {
                                setEditingDateId(item.id);
                                setEditDateFields({
                                  date: item.date ?? "",
                                  weather: item.weather ?? "",
                                  hight: item.hight ?? "",
                                  lowt: item.lowt ?? "",
                                  supervisor: item.supervisor ?? "",
                                  labor: item.labor ?? "",
                                  observation: item.observation ?? "",
                                  remark: item.remark ?? "",
                                  comment: item.comment ?? "",
                                  equipment: item.equipment ?? "",
                                });
                              }} style={{ backgroundColor: 'green', color: 'white', border: 'none', padding: '4px 10px', cursor: 'pointer', marginRight: 4 }}>Modify</button>
                              <button onClick={() => { if (window.confirm(`Delete record for ${item.date}?`)) client.models.Date.delete({ id: item.id }); }} style={{ backgroundColor: 'red', color: 'white', border: 'none', padding: '4px 10px', cursor: 'pointer' }}>Delete</button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ThemeProvider>
              </ScrollView>
            </>)
          },
          ...(showExtraTabs ? [{
            label: "History Data",
            value: "2",
            content: (<>
              <ScrollView
                as="div"
                ariaLabel="View example"
                backgroundColor="var(--amplify-colors-white)"
                borderRadius="6px"
                color="var(--amplify-colors-blue-60)"
                padding="1rem"
                height="700px"
              >
                <ThemeProvider theme={theme} colorMode="light">
                  <Table caption="" highlightOnHover={false} variation="striped"
                    style={{
                      //tableLayout: 'fixed',
                      width: '100%',
                      fontFamily: 'Arial, sans-serif',
                    }}>
                    <TableHead>
                      <TableRow>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Date</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Time</TableCell>
                        <TableCell as="th" /* style={{ width: '10%' }} */>Track</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Type</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>User</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Diameter</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Length</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Images</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Latitude</TableCell>
                        <TableCell as="th" /* style={{ width: '15%' }} */>Longitude</TableCell>
                        <TableCell as="th">Joint</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[...location].sort((a, b) => {
                          const trackDiff = (a.track ?? 0) - (b.track ?? 0);
                          if (trackDiff !== 0) return trackDiff;
                          const dateA = `${a.date ?? ''}T${a.time ?? ''}`;
                          const dateB = `${b.date ?? ''}T${b.time ?? ''}`;
                          return dateB.localeCompare(dateA);
                        }).map((location) => (
                        <TableRow
                          onDoubleClick={(e) => {
                            console.log("location photos url =", location.photos)
                            console.log(e)
                            if (location.photos)
                              deleteLocation2(location.id, location.photos)
                            else
                              deleteLocation(location.id)
                          }


                          }
                          key={location.id}
                        >
                          <TableCell /* width="15%" */>{location.date}</TableCell>
                          <TableCell /* width="15%" */>{location.time}</TableCell>
                          <TableCell /* width="10%" */>{location.track}</TableCell>
                          <TableCell /* width="15%" */>{location.type}</TableCell>
                          <TableCell /* width="15%" */>{location.username}</TableCell>
                          <TableCell /* width="15%" */>{location.diameter}</TableCell>
                          <TableCell /* width="15%" */>{location.length != null ? Math.round(Number(location.length)) : ''}</TableCell>
                          <TableCell /* width="15%" */>{location.photos ? location.photos.length : 0}</TableCell>
                          <TableCell /* width="15%" */>{location.lat != null ? Number(location.lat).toFixed(6) : ''}</TableCell>
                          <TableCell /* width="15%" */>{location.lng != null ? Number(location.lng).toFixed(6) : ''}</TableCell>
                          <TableCell>{jointMap[location.id] ?? ''}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>

                  </Table>
                </ThemeProvider>
              </ScrollView>
            </>)
          }] : []),
          ...(showExtraTabs ? [{
            label: "Track Info",
            value: "4",
            content: (<>
              <ScrollView
                as="div"
                ariaLabel="Track Info"
                backgroundColor="var(--amplify-colors-white)"
                borderRadius="6px"
                color="var(--amplify-colors-blue-60)"
                padding="1rem"
                height="700px"
              >
                <ThemeProvider theme={theme} colorMode="light">
                  <Table caption="" highlightOnHover={false} variation="striped"
                    style={{ width: '100%', fontFamily: 'Arial, sans-serif' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell as="th">✓</TableCell>
                        <TableCell as="th">Track</TableCell>
                        <TableCell as="th">Type</TableCell>
                        <TableCell as="th">Geometry</TableCell>
                        <TableCell as="th">Quantity</TableCell>
                        <TableCell as="th">Unit Price</TableCell>
                        <TableCell as="th">Value</TableCell>
                        <TableCell as="th"></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell></TableCell>
                        <TableCell>
                          <input type="text" value={newTrackFields.track} placeholder="track"
                            onChange={e => setNewTrackFields(p => ({ ...p, track: e.target.value }))} style={{ width: '100%' }} />
                        </TableCell>
                        <TableCell>
                          <input type="text" value={newTrackFields.type} placeholder="type"
                            onChange={e => setNewTrackFields(p => ({ ...p, type: e.target.value }))} style={{ width: '100%' }} />
                        </TableCell>
                        <TableCell>
                          <select value={newTrackFields.geometry}
                            onChange={e => setNewTrackFields(p => ({ ...p, geometry: e.target.value as "line" | "point" | "polygon" | "" }))}
                            style={{ width: '100%' }}>
                            <option value="">-- select --</option>
                            <option value="line">line</option>
                            <option value="point">point</option>
                            <option value="polygon">polygon</option>
                          </select>
                        </TableCell>
                        <TableCell>
                          <input type="number" value={newTrackFields.quantity} placeholder="quantity"
                            onChange={e => setNewTrackFields(p => ({ ...p, quantity: e.target.value === "" ? "" : Number(e.target.value) }))} style={{ width: '100%' }} />
                        </TableCell>
                        <TableCell>
                          <input type="number" value={newTrackFields.unitprice} placeholder="unit price"
                            onChange={e => setNewTrackFields(p => ({ ...p, unitprice: e.target.value === "" ? "" : Number(e.target.value) }))} style={{ width: '100%' }} />
                        </TableCell>
                        <TableCell>
                          <input type="number" value={newTrackFields.value} placeholder="value"
                            onChange={e => setNewTrackFields(p => ({ ...p, value: e.target.value === "" ? "" : Number(e.target.value) }))} style={{ width: '100%' }} />
                        </TableCell>
                        <TableCell>
                          <button onClick={createTrackInfo} style={{ backgroundColor: 'green', color: 'white', border: 'none', padding: '4px 10px', cursor: 'pointer' }}>Add</button>
                        </TableCell>
                      </TableRow>
                      {[...trackInfoList].sort((a, b) => (a.track ?? '').localeCompare(b.track ?? '')).map(item => {
                        const isEditing = editingTrackId === item.id;
                        const ef = editTrackFields;
                        const setEf = (field: keyof typeof editTrackFields, val: string | number | "") =>
                          setEditTrackFields(prev => ({ ...prev, [field]: val }));
                        return isEditing ? (
                          <TableRow key={item.id}>
                            <TableCell>
                              <input type="text" value={ef.track}
                                onChange={e => setEf('track', e.target.value)} style={{ width: '100%' }} />
                            </TableCell>
                            <TableCell>
                              <input type="text" value={ef.type}
                                onChange={e => setEf('type', e.target.value)} style={{ width: '100%' }} />
                            </TableCell>
                            <TableCell>
                              <select value={ef.geometry}
                                onChange={e => setEf('geometry', e.target.value)}
                                style={{ width: '100%' }}>
                                <option value="">-- select --</option>
                                <option value="line">line</option>
                                <option value="point">point</option>
                                <option value="polygon">polygon</option>
                              </select>
                            </TableCell>
                            <TableCell>
                              <input type="number" value={ef.quantity}
                                onChange={e => setEf('quantity', e.target.value === "" ? "" : Number(e.target.value))} style={{ width: '100%' }} />
                            </TableCell>
                            <TableCell>
                              <input type="number" value={ef.unitprice}
                                onChange={e => setEf('unitprice', e.target.value === "" ? "" : Number(e.target.value))} style={{ width: '100%' }} />
                            </TableCell>
                            <TableCell>
                              <input type="number" value={ef.value}
                                onChange={e => setEf('value', e.target.value === "" ? "" : Number(e.target.value))} style={{ width: '100%' }} />
                            </TableCell>
                            <TableCell>
                              <button onClick={() => saveTrackInfo(item.id)} style={{ marginRight: 4, backgroundColor: 'green', color: 'white', border: 'none', padding: '4px 10px', cursor: 'pointer' }}>Save</button>
                              <button onClick={() => setEditingTrackId(null)} style={{ backgroundColor: 'red', color: 'white', border: 'none', padding: '4px 10px', cursor: 'pointer' }}>Cancel</button>
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow key={item.id}>
                            <TableCell style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={trackChecked[item.id] ?? true}
                                onChange={e => setTrackChecked(prev => ({ ...prev, [item.id]: e.target.checked }))}
                              />
                            </TableCell>
                            <TableCell>{item.track}</TableCell>
                            <TableCell>{item.type}</TableCell>
                            <TableCell>{item.geometry}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.unitprice}</TableCell>
                            <TableCell>{item.value}</TableCell>
                            <TableCell>
                              <button onClick={() => {
                                setEditingTrackId(item.id);
                                setEditTrackFields({
                                  track: item.track ?? "",
                                  type: item.type ?? "",
                                  geometry: (item.geometry ?? "") as "line" | "point" | "polygon" | "",
                                  quantity: item.quantity ?? "",
                                  unitprice: item.unitprice ?? "",
                                  value: item.value ?? "",
                                });
                              }} style={{ backgroundColor: 'green', color: 'white', border: 'none', padding: '4px 10px', cursor: 'pointer', marginRight: 4 }}>Modify</button>
                              <button onClick={() => { if (window.confirm(`Delete track record?`)) client.models.Track.delete({ id: item.id }); }} style={{ backgroundColor: 'red', color: 'white', border: 'none', padding: '4px 10px', cursor: 'pointer' }}>Delete</button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ThemeProvider>
              </ScrollView>
            </>)
          }] : []),
        ]}
      />

    </main>
  );
}

export default App;
