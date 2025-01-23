CREATE OR REPLACE FUNCTION update_tag_keys()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "post history"
  SET "artists" = array_replace("artists", OLD.tag, NEW.tag)
  WHERE "artists" @> ARRAY[OLD.tag];
  
  UPDATE "post history"
  SET "characters" = array_replace("characters", OLD.tag, NEW.tag)
  WHERE "characters" @> ARRAY[OLD.tag];
  
  UPDATE "post history"
  SET "series" = array_replace("series", OLD.tag, NEW.tag)
  WHERE "series" @> ARRAY[OLD.tag];
  
  UPDATE "post history"
  SET "tags" = array_replace("tags", OLD.tag, NEW.tag)
  WHERE "tags" @> ARRAY[OLD.tag];
  
  UPDATE "post history"
  SET "addedTags" = array_replace("addedTags", OLD.tag, NEW.tag)
  WHERE "addedTags" @> ARRAY[OLD.tag];
  
  UPDATE "post history"
  SET "removedTags" = array_replace("removedTags", OLD.tag, NEW.tag)
  WHERE "removedTags" @> ARRAY[OLD.tag];
  
  UPDATE "tag edit requests"
  SET "implications" = array_replace("implications", OLD.tag, NEW.tag)
  WHERE "implications" @> ARRAY[OLD.tag];
  
  UPDATE "tag history"
  SET "implications" = array_replace("implications", OLD.tag, NEW.tag)
  WHERE "implications" @> ARRAY[OLD.tag];

  UPDATE "note history"
  SET "notes" = (
    SELECT jsonb_agg(
      CASE WHEN note->>'characterTag' = OLD.tag THEN
          jsonb_set(note, '{characterTag}', to_jsonb(NEW.tag))
      ELSE note END
    )
    FROM jsonb_array_elements("notes") AS note
  )
  WHERE EXISTS (
    SELECT 1 FROM jsonb_array_elements("notes") AS note
    WHERE note->>'characterTag' = OLD.tag
  );

  UPDATE "post history"
  SET "tagGroups" = (
    SELECT jsonb_agg(jsonb_set(tag_group::jsonb, '{tags}', 
        (SELECT jsonb_agg(CASE WHEN tag = OLD.tag THEN NEW.tag ELSE tag END)
         FROM jsonb_array_elements_text(tag_group->'tags') AS tag)
      ))
    FROM jsonb_array_elements("tagGroups") AS tag_group
  )
  WHERE EXISTS (
    SELECT 1 FROM jsonb_array_elements("tagGroups") AS tag_group
    WHERE EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(tag_group->'tags') AS tag
      WHERE tag = OLD.tag
  ));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_tag_keys()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "post history"
  SET "artists" = array_remove("artists", OLD.tag)
  WHERE "artists" @> ARRAY[OLD.tag];
  
  UPDATE "post history"
  SET "characters" = array_remove("characters", OLD.tag)
  WHERE "characters" @> ARRAY[OLD.tag];
  
  UPDATE "post history"
  SET "series" = array_remove("series", OLD.tag)
  WHERE "series" @> ARRAY[OLD.tag];
  
  UPDATE "post history"
  SET "tags" = array_remove("tags", OLD.tag)
  WHERE "tags" @> ARRAY[OLD.tag];
  
  UPDATE "post history"
  SET "addedTags" = array_remove("addedTags", OLD.tag)
  WHERE "addedTags" @> ARRAY[OLD.tag];
  
  UPDATE "post history"
  SET "removedTags" = array_remove("removedTags", OLD.tag)
  WHERE "removedTags" @> ARRAY[OLD.tag];
  
  UPDATE "tag edit requests"
  SET "implications" = array_remove("implications", OLD.tag)
  WHERE "implications" @> ARRAY[OLD.tag];
  
  UPDATE "tag history"
  SET "implications" = array_remove("implications", OLD.tag)
  WHERE "implications" @> ARRAY[OLD.tag];

  UPDATE "note history"
  SET "notes" = (
    SELECT jsonb_agg(
      CASE WHEN note->>'characterTag' = OLD.tag THEN
          jsonb_set(note, '{characterTag}', 'null'::jsonb)
      ELSE note END
    )
    FROM jsonb_array_elements("notes") AS note
  )
  WHERE EXISTS (
    SELECT 1 FROM jsonb_array_elements("notes") AS note
    WHERE note->>'characterTag' = OLD.tag
  );

  UPDATE "post history"
  SET "tagGroups" = (
    SELECT jsonb_agg(jsonb_set(tag_group::jsonb, '{tags}', 
        (SELECT jsonb_agg(tag)
        FROM jsonb_array_elements_text(tag_group->'tags') AS tag
        WHERE tag != OLD.tag)
    ))
    FROM jsonb_array_elements("tagGroups") AS tag_group
  )
  WHERE EXISTS (
    SELECT 1 FROM jsonb_array_elements("tagGroups") AS tag_group
    WHERE EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(tag_group->'tags') AS tag
      WHERE tag = OLD.tag
  ));

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tag_trigger ON "tags";
CREATE TRIGGER update_tag_trigger
AFTER UPDATE OF "tag" ON "tags"
FOR EACH ROW EXECUTE FUNCTION update_tag_keys();

DROP TRIGGER IF EXISTS delete_tag_trigger ON "tags";
CREATE TRIGGER delete_tag_trigger
AFTER DELETE ON "tags" 
FOR EACH ROW EXECUTE FUNCTION delete_tag_keys();