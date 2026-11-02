import json, time, urllib.request, statistics, sys
from datetime import datetime, timezone
fetched=time.time()
URL="https://hn.algolia.com/api/v1/search_by_date?tags=show_hn&hitsPerPage=1000&page=0&numericFilters=created_at_i<%d"%int(fetched-48*3600)
d=json.load(urllib.request.urlopen(URL))
hits=d["hits"][:1000]
cut=fetched-48*3600
s=[h for h in hits if h["created_at_i"]<=cut]
pts=sorted((h.get("points") or 0) for h in s)
n=len(pts)
def share(k): return sum(p>=k for p in pts)/n*100
com=[(h.get("num_comments") or 0) for h in s]
out=dict(fetched_utc=datetime.fromtimestamp(fetched,timezone.utc).isoformat(timespec="seconds"),
 total_fetched=len(hits),excluded_young=len(hits)-n,n=n,median=statistics.median(pts),
 p10=round(share(10),1),p50=round(share(50),1),p100=round(share(100),1),
 median_comments=statistics.median(com),
 oldest=datetime.fromtimestamp(min(h["created_at_i"] for h in s),timezone.utc).isoformat(timespec="minutes"),
 newest=datetime.fromtimestamp(max(h["created_at_i"] for h in s),timezone.utc).isoformat(timespec="minutes"))
edges=[1,2,3,5,10,20,50,100,200,500,10**9]
out["hist"]=[[edges[i],edges[i+1]-1,sum(edges[i]<=p<edges[i+1] for p in pts)] for i in range(len(edges)-1)]
out["below1"]=sum(p<1 for p in pts)
from collections import defaultdict
wd=defaultdict(lambda:[0,0]);hr=defaultdict(lambda:[0,0])
for h in s:
  t=datetime.fromtimestamp(h["created_at_i"],timezone.utc);ok=(h.get("points") or 0)>=10
  wd[t.weekday()][0]+=1;wd[t.weekday()][1]+=ok;hr[t.hour][0]+=1;hr[t.hour][1]+=ok
out["weekday"]={k:v for k,v in sorted(wd.items())};out["hour"]={k:v for k,v in sorted(hr.items())}
print(json.dumps(out))
