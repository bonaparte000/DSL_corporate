import re

_LOC_RE = re.compile(
    r'\s*(압구정|강남역?|건대입구|건대|역삼|선릉|신사동?|청담|홍대|합정|'
    r'이태원|종로|명동|잠실|삼성|서초|방배|마포|연남|성수|망원|연희|'
    r'한남|용산|광화문|을지로|충무로|인사동|혜화|신촌|이대|사당|'
    r'수원|분당|판교|일산)\s*점?\s*$'
)
_ENG_RE = re.compile(r'[A-Za-z]+')


def normalize_brand(name: str) -> str:
    name = _ENG_RE.sub('', name).strip()
    name = _LOC_RE.sub('', name).strip()
    return name


def normalize_brand_list(brands: list) -> list:
    result = []
    for b in brands:
        if isinstance(b, str):
            nb = normalize_brand(b)
            if nb:
                result.append(nb)
    return result
