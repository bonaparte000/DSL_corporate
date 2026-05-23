import json
import asyncio
import re

from openai import AsyncOpenAI

from .normalizer import normalize_brand_list
from . import config

EXTRACT_SYSTEM = """\
아래 텍스트에서 뷰티 샵, 타투 스튜디오, 반영구화장 샵의 고유 브랜드/샵 이름을 추출하세요.
일반 명사(단독 '샵', '아뜰리에', '스튜디오')는 제외하고, 고유 브랜드명만 추출하세요.
반드시 아래 JSON 형식으로만 반환하세요:
{"brands": ["브랜드1", "브랜드2", ...]}
브랜드가 없으면 {"brands": []} 반환."""


async def extract_brands_single(answer: str, client: AsyncOpenAI) -> list:
    for attempt in range(10):
        try:
            resp = await client.chat.completions.create(
                model=config.EXTRACT_MODEL,
                messages=[
                    {'role': 'system', 'content': EXTRACT_SYSTEM},
                    {'role': 'user',   'content': answer},
                ],
                temperature=0,
                max_tokens=300,
                response_format={'type': 'json_object'},
            )
            parsed = json.loads(resp.choices[0].message.content)
            return normalize_brand_list(parsed.get('brands', []))
        except Exception as e:
            if '429' in str(e) or 'rate_limit' in str(e).lower():
                match = re.search(r'try again in ([0-9.]+)s', str(e))
                wait = float(match.group(1)) + 1.0 if match else 5.0
                await asyncio.sleep(wait)
            else:
                return []
    return []


async def extract_brands_all(answers: list, client: AsyncOpenAI, verbose: bool = True) -> list:
    results = []
    for i, answer in enumerate(answers):
        if verbose:
            print(f'\r  브랜드 추출: {i+1}/{len(answers)}', end='', flush=True)
        brands = await extract_brands_single(answer, client)
        results.append(brands)
        await asyncio.sleep(config.CALL_DELAY)
    if verbose:
        print()
    return results
