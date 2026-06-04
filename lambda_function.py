import json
from datetime import datetime
from collections import defaultdict

import boto3

TABLE_NAME = "Location-oz6w2l4cczftjg7yqcko6q2c4y-NONE"
REFERENCE_DATE = datetime(2026, 6, 1, 0, 0, 0)

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)


def parse_datetime(date_str, time_str):
    date_str = (date_str or "").replace("/", "-").strip()
    time_str = (time_str or "00:00:00").strip()
    return datetime.fromisoformat(f"{date_str}T{time_str}")


def calc_timestamp(date_str, time_str):
    dt = parse_datetime(date_str, time_str)
    return round((dt - REFERENCE_DATE).total_seconds() / 86400.0, 6)


def lambda_handler(event, context):
    tracks = defaultdict(list)

    scan_kwargs = {}
    while True:
        response = table.scan(**scan_kwargs)
        for item in response["Items"]:
            track_num = item.get("track")
            if track_num is None:
                continue
            ts = calc_timestamp(item.get("date", ""), item.get("time", ""))
            tracks[track_num].append({
                "type": item.get("type", ""),
                "timestamp": ts,
                "lng": round(float(item.get("lng", 0)), 6),
                "lat": round(float(item.get("lat", 0)), 6),
            })

        if "LastEvaluatedKey" in response:
            scan_kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]
        else:
            break

    output = []
    for idx, track_num in enumerate(sorted(tracks.keys())):
        records = tracks[track_num]
        records.sort(key=lambda r: r["timestamp"])
        output.append({
            "id": idx,
            "type": records[0]["type"] if records else "",
            "timestamps": [r["timestamp"] for r in records],
            "path": [[r["lng"], r["lat"]] for r in records],
        })

    return output
