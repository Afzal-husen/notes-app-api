import { Request, Response, NextFunction, RequestHandler } from "express";
import { prisma } from "../lib/prisma-client.js";
import { UnauthorizedError } from "../errors/unauthorized.js";
import { BadRequestError } from "../errors/bad-request.js";
import { NotFoundError } from "../errors/not-found.js";

const createNote: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      title,
      content,
      name,
      tags,
    }: {
      title: string;
      content: string;
      name: string;
      tags: Array<{ name: string }> | undefined;
    } = req.body;
    const userId = req?.user?.id;

    if (!userId) return next(new UnauthorizedError("User not authorized"));

    if (!title || !content)
      return next(new BadRequestError("Title and content are required"));

    const note = await prisma.$transaction(async (prisma) => {
      const category = name
        ? await prisma.category.upsert({
            where: {
              name_user_id: {
                name: name as string,
                user_id: userId,
              },
            },
            update: {},
            create: { name, user_id: userId },
          })
        : null;

      const createdNote = await prisma.note.create({
        data: {
          title,
          content,
          user_id: userId,
          category_id: category?.id,
        },
      });

      if (tags && Array.isArray(tags)) {
        const uniqueTags = tags.map((tag) => ({
          name: tag.name,
          user_id: userId,
        }));

        await prisma.tag.createMany({ data: uniqueTags, skipDuplicates: true });

        const tagRecords = await prisma.tag.findMany({
          where: { name: { in: tags.map((tag) => tag.name) }, user_id: userId },
        });

        await prisma.noteTag.createMany({
          data: tagRecords.map((tag) => {
            return { note_id: createdNote.id, tag_id: tag?.id };
          }),
        });
      }

      return createdNote;
    });

    const jsonBody = {
      error: false,
      message: "Note create!",
      note,
    };

    res.status(201).json(jsonBody);
  } catch (error) {
    next(error);
  }
};

const updateNote: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req?.user?.id;
    const noteId = req?.params?.id;

    const {
      title,
      content,
      name,
      tags,
    }: Partial<{
      title: string;
      content: string;
      name: string;
      tags: Array<{ name: string }> | undefined;
    }> = req?.body;

    if (!userId) return next(new UnauthorizedError("User unauthorized"));
    if (!noteId) return next(new BadRequestError("Note id is required"));

    const existingNote = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!existingNote || existingNote.user_id !== userId)
      return next(new NotFoundError("Note not found"));

    const updatedNote = await prisma.$transaction(async (prisma) => {
      const category = name
        ? await prisma.category.upsert({
            where: { name_user_id: { name, user_id: userId } },
            update: {},
            create: { name, user_id: userId },
          })
        : null;

      const updatedNote = await prisma.note.update({
        where: { id: noteId },
        data: {
          title: title || existingNote.title,
          content: content || existingNote.content,
          category_id: category?.id || existingNote.category_id,
        },
      });

      if (tags && tags.length > 0) {
        const uniqueTags = tags.map((tag) => ({
          name: tag.name,
          user_id: userId,
        }));

        await prisma.tag.createMany({
          data: uniqueTags,
          skipDuplicates: true,
        });

        const tagRecords = await prisma.tag.findMany({
          where: { name: { in: tags.map((tag) => tag.name) }, user_id: userId },
        });

        await prisma.noteTag.deleteMany({
          where: { note_id: noteId },
        });

        await prisma.noteTag.createMany({
          data: tagRecords.map((tag) => ({ note_id: noteId, tag_id: tag.id })),
        });
      }

      return updatedNote;
    });

    const jsonBody = {
      error: false,
      message: "Note updated successfully!",
      note: updatedNote,
    };

    res.status(200).json(jsonBody);
  } catch (error) {
    next(error);
  }
};

const deleteNote: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const noteId = req?.params?.id;
    const userId = req?.user?.id;

    if (!userId) return next(new UnauthorizedError("User unauthorized"));
    if (!noteId) return next(new NotFoundError("Note not found"));

    await prisma.note.delete({
      where: { id: userId },
    });

    const jsonBody = {
      error: false,
      message: "Note deleted successfully!",
    };

    res.status(200).json(jsonBody);
  } catch (error) {
    next(error);
  }
};

const getNotes: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req?.params?.id;
    const page = Number(req?.query?.page || 1);
    const per_page = Number(req?.query?.per_page || 50);
    const skip = (page - 1) * per_page || 0;

    if (userId && userId !== req?.user?.id)
      return next(new UnauthorizedError("User unautorized"));

    const notes = await prisma.note.findMany({
      where: { user_id: userId },
      take: per_page,
      skip,
    });

    const jsonBody = {
      error: false,
      data: notes,
    };

    res.status(200).json(jsonBody);
  } catch (error) {
    next(error);
  }
};

const getNote: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const noteId = req?.params?.id;
    const userId = req?.user?.id;

    if (!userId) return next(new UnauthorizedError("User is unauthorized"));
    if (!noteId) return next(new BadRequestError("Note id is required"));

    const note = await prisma.note.findFirst({
      where: { id: noteId, AND: { user_id: userId } },
    });

    const jsonBody = {
      error: false,
      data: note,
    };

    res.status(200).json(jsonBody);
  } catch (error) {
    next(error);
  }
};
export { createNote, deleteNote, updateNote, getNotes, getNote };
