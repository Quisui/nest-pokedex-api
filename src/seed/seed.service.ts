import { Injectable } from '@nestjs/common';
import { PokeResponse } from './interfaces/poke-response.interface';
import { PokemonService } from 'src/pokemon/pokemon.service';
import { CreatePokemonDto } from 'src/pokemon/dto/create-pokemon.dto';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';

@Injectable()
export class SeedService {
  constructor(
    private readonly pokemonService: PokemonService,
    private readonly http: AxiosAdapter,
  ) {}
  async executeSeed() {
    this.pokemonService.removeAll();
    const data = await this.http.get<PokeResponse>(
      'https://pokeapi.co/api/v2/pokemon?limit=650',
    );

    const pokemon: CreatePokemonDto[] = [];
    data.results.forEach(({ name, url }) => {
      const segment = url.split('/');
      const no = segment[segment.length - 2];

      pokemon.push({ no: +no, name: name.toLowerCase() });
    });

    await this.pokemonService.createBulk(pokemon);
    return pokemon;
  }
}
