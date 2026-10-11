#!/usr/bin/env python3
"""Safe application of CL Projektwerk Studio V3 package to a compatible Next.js repo.
Dry-run unless explicitly passed --write. Does not deploy.
"""
import argparse, pathlib, json, shutil, datetime, sys, difflib
p=argparse.ArgumentParser();p.add_argument('project',type=pathlib.Path);p.add_argument('--write',action='store_true');a=p.parse_args()
root=pathlib.Path(__file__).resolve().parent;project=a.project.resolve()
paths=['src/messages/de.json','src/messages/en.json','src/app/globals.css','src/config/layouts.ts']
changes={};conflicts=[];warnings=[]

def apply_recursive(old,new,cur,path):
    if isinstance(old,dict) and isinstance(new,dict) and isinstance(cur,dict):
        out=dict(cur)
        for k in old:
            if k in new and k in cur:
                out[k]=apply_recursive(old[k],new[k],cur[k],path+(str(k),))
        return out
    if isinstance(old,list) and isinstance(new,list) and isinstance(cur,list) and len(old)==len(new)==len(cur):
        return [apply_recursive(x,y,z,path+(str(i),)) for i,(x,y,z) in enumerate(zip(old,new,cur))]
    if old==new: return cur
    if old==cur:return new
    if new==cur:return cur
    conflicts.append(''.join(['.',*path]).lstrip('.'))
    return cur

for rel in paths:
    src=project/rel;before=root/'baseline'/rel;after=root/'update'/rel
    if not src.is_file():warnings.append(rel+' missing – skipped');continue
    try:
        if rel.endswith('.json'):
            b=json.loads(before.read_text(encoding='utf-8'));n=json.loads(after.read_text(encoding='utf-8'));c=json.loads(src.read_text(encoding='utf-8'))
            res=apply_recursive(b,n,c,(rel,))
            if res!=c: changes[rel]=(src, json.dumps(res,ensure_ascii=False,indent=2)+'\n')
        else:
            b=before.read_bytes();c=src.read_bytes();n=after.read_text(encoding='utf-8')
            if c==b:changes[rel]=(src,n)
            elif c!=after.read_bytes():warnings.append(rel+' differs from source baseline – skipped (manual merge required)')
    except Exception as e:
        warnings.append(rel+' failed to compare: '+str(e))
print('Mode:', 'WRITE' if a.write else 'DRY RUN')
print('Changes:',*(changes.keys() or ['none']),sep='\n - ')
if conflicts:print('Text conflicts preserved:',*conflicts,sep='\n - ')
if warnings:print('Warnings:',*warnings,sep='\n - ')
if a.write and changes:
    stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    archive=project/'.cl-studio-v3-backup'/stamp
    for rel,(src,txt) in changes.items():
        target=archive/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,target)
        src.write_text(txt,encoding='utf-8')
    print('Written:',len(changes),'files. Backups:',archive)
else: print('No files written.')
