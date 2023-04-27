import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Model, isValidObjectId } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class PokemonService {
  constructor(
    @InjectModel(Pokemon.name) private readonly pokemonModel: Model<Pokemon>,
  ) {}

  async create<T>(createPokemonDto: CreatePokemonDto): Promise<T> {
    createPokemonDto.name = createPokemonDto.name.toLowerCase();
    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon as T;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async createBulk(createPokemonDto: CreatePokemonDto[]): Promise<Pokemon[]> {
    try {
      const pokemon = await this.pokemonModel.insertMany(createPokemonDto);
      return pokemon;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll(paginationDto?: PaginationDto): Promise<Pokemon[]> {
    const limit = paginationDto?.limit ?? 10;
    const offset = paginationDto?.offset ?? 0;
    return await this.pokemonModel.find().skip(offset).limit(limit);
  }

  async findOne(id: string): Promise<Pokemon> {
    let pokemon: Pokemon | null = null;
    if (!isNaN(+id)) {
      pokemon = await this.pokemonModel.findOne({ no: +id });
      if (!pokemon) {
        throw new NotFoundException(`Pokemon with id ${id} does not exists`);
      }
    }

    if (!pokemon && isValidObjectId(id)) {
      pokemon = await this.pokemonModel.findById(id);
    }

    if (!pokemon) {
      pokemon = await this.pokemonModel.findOne({
        name: id.toLowerCase().trim(),
      });
    }

    if (!pokemon) {
      throw new NotFoundException(`Pokemon does not exist`);
    }

    return pokemon;
  }

  async update(
    id: string,
    updatePokemonDto: UpdatePokemonDto,
  ): Promise<Pokemon> {
    const pokemon = await this.findOne(id);
    try {
      if (updatePokemonDto.name) {
        updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
      }
      await pokemon.updateOne(updatePokemonDto, {
        new: true,
      });
      return { ...pokemon.toJSON(), ...updatePokemonDto } as Pokemon;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string) {
    const deletedPokemon = await this.pokemonModel.findByIdAndDelete(id);

    if (!deletedPokemon) {
      throw new NotFoundException(`Pokemon with id ${id} does not exist`);
    }
  }

  async removeAll() {
    await this.pokemonModel.deleteMany({});
  }

  private handleExceptions(error: any) {
    if (error.code === 11000) {
      throw new BadRequestException(
        `Couldn't update your pokemon in db ${JSON.stringify(error.keyValue)}`,
      );
    }
    console.log(
      '🚀 ~ file: pokemon.service.ts:19 ~ PokemonService ~ error:',
      error,
    );
    throw new InternalServerErrorException('Check server logs.');
  }
}
