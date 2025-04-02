// Helper Functions

async function chooseRandom(arr)
{
  return arr[await getRandomNumber(arr.length - 1, 0)];
}

async function fetchJSON(url)
{
  const response = await fetch(url);
  return await response.json();
}

function getIdParam()
{
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || params.get('pokemon');
}


// Formatting Functions

function formatDesc(str) {
  return str
  .replaceAll('\n', ' ')
  .replaceAll('\f', ' ');
}

const filterToEnglish = ({language}) => language.name === 'en';


// Main Functions

async function getRandomNumber(max, min = 1)
{
  let url = 'https://www.random.org/integers/?num=1&col=1&base=10&format=plain&rnd=new';
  url += `&min=${min}&max=${max}`;
  const response = await fetch(url);
  return await response.json();
}

async function getPokemon(id)
{
  let pokemonData = await fetchJSON(`https://pokeapi.co/api/v2/pokemon/${id}`);
  let pokemonText = await fetchJSON(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
  const types = [
    ...pokemonData.types
      .sort((a, b) => a.slot - b.slot)
      .map(({type}) => fetchJSON(type.url))
  ];
  console.log(pokemonData.sprites)
  for (let t = 0; t < types.length; ++t) types[t] = await types[t];
  return {
    name: pokemonText.names.filter(filterToEnglish)[0].name,
    desc: formatDesc((await chooseRandom(pokemonText.flavor_text_entries.filter(filterToEnglish))).flavor_text),
    img: pokemonData.sprites.other['official-artwork'].front_default,
    sprites: [
      pokemonData.sprites.front_female,
      pokemonData.sprites.front_default,
      pokemonData.sprites.front_shiny_female,
      pokemonData.sprites.front_shiny,
    ].filter(i=>i),
    weight: pokemonData.weight / 10,
    height: pokemonData.height / 10,
    types: types.map(type => type.names.filter(filterToEnglish)[0].name).join(' & '),
    url: 'https://pokemondb.net/pokedex/' + id,
  };
}

async function getRandomPokemon()
{
  const id = await getRandomNumber(1025);
  return await getPokemon(id);
}

async function populatePage(pokemon)
{
  for (const [name, value] of Object.entries(pokemon))
  {
    try {
      const element = document.getElementById('pokemon-'+name);
      switch (name)
      {
        case 'url':
          element.href = value;
          break;
        case 'img':
          element.src = value;
          break;
        default:
          element.innerText = value;
          break;
      }
    } catch (e) {
      console.log(`Error while iterating pokemon ${pokemon.name}'s ${name} value ('${value}'): ${e.message}`);
    }
  }
  let clicks = 0;
  let index = 0;
  const image = document.getElementById('pokemon-img')
  image.addEventListener("click", (event) => {
    clicks += 1;
    if (clicks >= 5) {
      clicks = 0;
      image.className = "pixel"
      if (index >= pokemon.sprites.length) index = 0;
      image.src = pokemon.sprites[index];
      index += 1;
    }
  });;
}

function main()
{
  const id = getIdParam();
  if (id) getPokemon(id).then(populatePage);
  else getRandomPokemon().then(populatePage);
}

main();

const rerollButton = document.getElementById('reroll-button')

rerollButton.addEventListener('onClick', e => {
  e.preventDefault();
  main();
})
